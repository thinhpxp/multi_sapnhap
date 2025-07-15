// /api/get-new-wards.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  // Lấy province_code từ tham số URL, ví dụ: /api/get-new-wards?province_code=96
  const { province_code } = request.query;

  if (!province_code) {
    return response.status(400).json({ error: 'Thiếu tham số province_code.' });
  }

  try {
    const { data, error } = await supabase
      .from('new_wards')
      .select('ward_code, name')
      .eq('province_code', province_code) // Lọc theo mã tỉnh
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API get-new-wards:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách xã/phường.' });
  }
}