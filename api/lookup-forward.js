// api/lookup-forward.js
import { createClient } from '@supabase/supabase-js';

// Kết nối tới Supabase (sử dụng biến môi trường)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Hàm xử lý chính mà Vercel sẽ gọi
export default async function handler(request, response) {
  // Lấy mã xã cũ từ tham số URL, ví dụ: /api/lookup-forward?code=12345
  const { code } = request.query;

  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã cũ (code).' });
  }

  const oldWardCode = parseInt(code, 10);

  try {
    // Bước 1: Tìm trong bảng mapping
    const { data: mappingRecord, error: mappingError } = await supabase
      .from('mapping')
      .select('*')
      .eq('old_ward_code', oldWardCode)
      .single(); // .single() để chỉ lấy 1 bản ghi

    if (mappingError && mappingError.code !== 'PGRST116') {
        // PGRST116 là lỗi "không tìm thấy dòng nào", ta sẽ xử lý nó sau
        throw mappingError;
    }

    if (!mappingRecord) {
        // Không tìm thấy trong mapping, tức là địa chỉ không đổi
        return response.status(200).json({ changed: false });
    }

    // Bước 2 & 3: Lấy thông tin mới
    const newWardCode = mappingRecord.new_ward_code;
    // THAY ĐỔI 1: Lấy thêm ward_code
    const { data: newWardRecord, error: wardError } = await supabase
      .from('new_wards')
      .select('ward_code, name, province_code')
      .eq('ward_code', newWardCode)
      .single();

    if (wardError) throw wardError;

    // THAY ĐỔI 2: Lấy thêm province_code
    const { data: newProvinceRecord, error: provinceError } = await supabase
      .from('new_provinces')
      .select('province_code, name')
      .eq('province_code', newWardRecord.province_code)
      .single();

    if (provinceError) throw provinceError;

    // THAY ĐỔI 3: Trả về các mã code mới
    response.status(200).json({
      changed: true,
      new_ward_name: newWardRecord.name,
      new_ward_code: newWardRecord.ward_code, // <-- Thêm mới
      new_province_name: newProvinceRecord.name,
      new_province_code: newProvinceRecord.province_code, // <-- Thêm mới
    });

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}