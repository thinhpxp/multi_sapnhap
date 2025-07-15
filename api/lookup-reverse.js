
// api/lookup-reverse.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { code } = request.query;

  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã mới (code).' });
  }

  const newWardCode = parseInt(code, 10);

  try {
    // THAY ĐỔI: Lấy thêm old_ward_code
    const { data: oldUnitRecords, error } = await supabase
      .from('mapping')
      .select('old_ward_code, old_ward_name, old_district_name, old_province_name')
      .eq('new_ward_code', newWardCode);

    if (error) throw error;

    response.status(200).json(oldUnitRecords);

  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}