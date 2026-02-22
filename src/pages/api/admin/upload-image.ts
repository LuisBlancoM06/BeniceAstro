import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado - Token requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el token es válido y el usuario es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawFileName = formData.get('fileName') as string;
    // SEGURIDAD: Forzar bucket a 'product-images' — no permitir selección del cliente
    const bucket = 'product-images';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se proporcionó archivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo de archivo con lista blanca estricta
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF, AVIF)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'La imagen no puede superar 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SEGURIDAD: Validar magic bytes del archivo real
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJPEG = headerBytes[0] === 0xFF && headerBytes[1] === 0xD8 && headerBytes[2] === 0xFF;
    const isPNG = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4E && headerBytes[3] === 0x47;
    const isGIF = headerBytes[0] === 0x47 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46;
    const isWebP = headerBytes[8] === 0x57 && headerBytes[9] === 0x45 && headerBytes[10] === 0x42 && headerBytes[11] === 0x50;
    // AVIF starts with ftyp box
    const isAVIF = headerBytes[4] === 0x66 && headerBytes[5] === 0x74 && headerBytes[6] === 0x79 && headerBytes[7] === 0x70;

    if (!isJPEG && !isPNG && !isGIF && !isWebP && !isAVIF) {
      return new Response(JSON.stringify({ error: 'El contenido del archivo no coincide con un formato de imagen válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SEGURIDAD: Sanitizar nombre de archivo — solo alfanuméricos, guiones y puntos
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    let sanitizedName = '';
    if (rawFileName) {
      sanitizedName = rawFileName
        .replace(/\.\./g, '')       // Eliminar path traversal
        .replace(/[\/\\]/g, '')    // Eliminar separadores de ruta
        .replace(/[^a-zA-Z0-9_-]/g, '') // Solo alfanuméricos, guiones y underscores
        .slice(0, 100);              // Máximo 100 chars
    }
    const finalFileName = sanitizedName
      ? `${sanitizedName}-${Date.now()}.${ext}`
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(finalFileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return new Response(JSON.stringify({ error: 'Error al subir la imagen' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return new Response(JSON.stringify({ 
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in upload-image:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Eliminar imagen (requiere admin)
export const DELETE: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación de admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { path } = await request.json();
    // SEGURIDAD: Forzar bucket a 'product-images'
    const bucket = 'product-images';

    if (!path || typeof path !== 'string') {
      return new Response(JSON.stringify({ error: 'No se proporcionó path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SEGURIDAD: Sanitizar path contra path traversal
    if (path.includes('..') || path.includes('/') || path.includes('\\')) {
      return new Response(JSON.stringify({ error: 'Path no válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
