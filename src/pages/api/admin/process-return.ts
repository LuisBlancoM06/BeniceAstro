/**
 * POST /api/admin/process-return
 * 
 * Procesa el cambio de estado de una devolución (server-side).
 * Si el nuevo estado es "completada", genera automáticamente
 * una Factura de Abono (rectificativa) con importes negativos.
 * 
 * SEGURIDAD:
 * - Requiere autenticación admin verificada vía JWT
 * - La factura se genera con supabaseAdmin (service role)
 * - Nunca expone lógica de facturación al cliente
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    // 1. Autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers });
    }

    // 2. Verificar rol admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), { status: 403, headers });
    }

    // 3. Parsear body
    const body = await request.json();
    const { returnId, newStatus, refundAmount, adminNotes } = body;

    if (!returnId || !newStatus) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios: returnId, newStatus' }), { status: 400, headers });
    }

    const validStatuses = ['solicitada', 'aprobada', 'rechazada', 'completada'];
    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` }), { status: 400, headers });
    }

    // Validar transición de estado válida (máquina de estados)
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      solicitada: ['aprobada', 'rechazada'],
      aprobada: ['completada', 'rechazada'],
      rechazada: [],
      completada: [],
    };

    // 4. Obtener datos de la devolución actual
    const { data: returnData, error: returnError } = await supabaseAdmin
      .from('returns')
      .select('*, orders(id, total, user_id)')
      .eq('id', returnId)
      .single();

    if (returnError || !returnData) {
      return new Response(JSON.stringify({ error: 'Devolución no encontrada' }), { status: 404, headers });
    }

    // Verificar transición de estado permitida (saltar si no cambia)
    const currentStatus = returnData.status || 'solicitada';
    if (newStatus !== currentStatus) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        return new Response(JSON.stringify({
          error: `No se puede cambiar de "${currentStatus}" a "${newStatus}". Transiciones permitidas: ${allowed.length ? allowed.join(', ') : 'ninguna (estado final)'}`
        }), { status: 400, headers });
      }
    }

    // 5. Actualizar campos opcionales (refund_amount, admin_notes)
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (refundAmount !== undefined) {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount < 0) {
        return new Response(JSON.stringify({ error: 'Importe de reembolso inválido' }), { status: 400, headers });
      }
      updateData.refund_amount = amount;
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    // 6. Si cambia a "completada", generar factura de abono
    let invoiceNumber: string | null = null;

    if (newStatus === 'completada' && returnData.status !== 'completada') {
      const effectiveRefund = refundAmount
        ? parseFloat(refundAmount)
        : returnData.refund_amount;

      if (!effectiveRefund || effectiveRefund <= 0) {
        return new Response(JSON.stringify({
          error: 'No se puede completar la devolución sin importe de reembolso. Establece el importe primero.'
        }), { status: 400, headers });
      }

      // Generar número de factura de abono (server-side, atómico)
      const { data: invoiceNum, error: invoiceNumError } = await supabaseAdmin
        .rpc('generate_invoice_number', { inv_type: 'abono' });

      if (invoiceNumError || !invoiceNum) {
        console.error('Error generando número de factura de abono:', invoiceNumError);
        return new Response(JSON.stringify({ error: 'Error generando número de factura' }), { status: 500, headers });
      }

      invoiceNumber = invoiceNum;

      // Calcular importes negativos (IVA 21%)
      const total = -Math.abs(effectiveRefund);
      const subtotal = +(total / 1.21).toFixed(2);
      const taxAmount = +(total - subtotal).toFixed(2);

      // Insertar factura de abono
      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          order_id: returnData.order_id,
          user_id: returnData.orders?.user_id || returnData.user_id,
          invoice_number: invoiceNumber,
          invoice_type: 'abono',
          subtotal,
          tax_amount: taxAmount,
          total,
        });

      if (invoiceError) {
        console.error('Error insertando factura de abono:', invoiceError);
        return new Response(JSON.stringify({ error: 'Error creando factura de abono' }), { status: 500, headers });
      }
    }

    // 7. Actualizar estado de la devolución
    const { error: updateError } = await supabaseAdmin
      .from('returns')
      .update(updateData)
      .eq('id', returnId);

    if (updateError) {
      console.error('Error actualizando devolución:', updateError);
      return new Response(JSON.stringify({ error: 'Error actualizando estado de la devolución' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({
      success: true,
      status: newStatus,
      invoiceNumber,
      message: newStatus === 'completada'
        ? `Devolución completada. Factura de abono ${invoiceNumber} generada.`
        : `Estado actualizado a "${newStatus}".`,
    }), { status: 200, headers });

  } catch (error) {
    console.error('Error en process-return:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers });
  }
};
