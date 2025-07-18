// /api/export-data.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Hàm để tìm chi tiết đơn vị cũ từ tệp old_data.js
function findOldUnitDetails(wardCode, allProvincesData) {
    for (const province of allProvincesData) {
        for (const district of province.districts) {
            for (const ward of district.wards) {
                if (ward.code === wardCode) {
                    return {
                        districtCode: district.code,
                        provinceCode: province.code
                    };
                }
            }
        }
    }
    return null;
}

export default async function handler(request, response) {
  try {
    console.log("API export-data: Bắt đầu xử lý.");

    // 1. Lấy dữ liệu từ Supabase
    const { data: mappingData, error: mappingError } = await supabase.from('mapping').select('*');
    if (mappingError) throw mappingError;

    const { data: newWardsData, error: wardsError } = await supabase.from('new_wards').select('*');
    if (wardsError) throw wardsError;

    const { data: newProvincesData, error: provincesError } = await supabase.from('new_provinces').select('*');
    if (provincesError) throw provincesError;

    console.log(`API export-data: Đã lấy thành công ${mappingData.length} bản ghi mapping từ Supabase.`);

    // 2. Đọc tệp old_data.js từ hệ thống tệp của Vercel
    // Vercel sẽ đặt thư mục public của bạn ở đâu đó trong hệ thống
    const oldDataPath = path.resolve('./public/data/old_data.js');
    // Đọc tệp, loại bỏ phần "window.allProvincesData = " và dấu ; ở cuối để nó trở thành JSON hợp lệ
    const oldDataFileContent = fs.readFileSync(oldDataPath, 'utf8');
    const oldDataJsonString = oldDataFileContent.replace('window.allProvincesData = ', '').slice(0, -1);
    const allProvincesData = JSON.parse(oldDataJsonString);
    console.log("API export-data: Đã đọc và phân tích thành công tệp old_data.js.");

    // 3. Tổng hợp dữ liệu
    const consolidatedList = mappingData.map(mappingRecord => {
        const newWard = newWardsData.find(w => w.ward_code === mappingRecord.new_ward_code);
        const newProvince = newWard ? newProvincesData.find(p => p.province_code == newWard.province_code) : null;
        const oldDetails = findOldUnitDetails(mappingRecord.old_ward_code, allProvincesData);

        return {
            "Phuong/Xa Truoc Sap Nhap": mappingRecord.old_ward_name,
            "Code Phuong/Xa Truoc Sap Nhap": mappingRecord.old_ward_code,
            "Quan/Huyen Truoc Sap Nhap": mappingRecord.old_district_name,
            "Code Quan/Huyen Truoc Sap Nhap": oldDetails ? oldDetails.districtCode : 'N/A',
            "Tinh/Thanh Pho Truoc Sap Nhap": mappingRecord.old_province_name,
            "Code Tinh/Thanh Pho Truoc Sap Nhap": oldDetails ? oldDetails.provinceCode : 'N/A',
            "Phuong/Xa Sau Sap Nhap": newWard ? newWard.name : 'N/A',
            "Code Phuong/Xa Sau Sap Nhap": mappingRecord.new_ward_code,
            "Tinh/Thanh Pho Sau Sap Nhap": newProvince ? newProvince.name : 'N/A',
            "Code Tinh/Thanh Pho Sau Sap Nhap": newProvince ? newProvince.province_code : 'N/A'
        };
    });

    console.log("API export-data: Hoàn tất tổng hợp. Gửi dữ liệu về cho client.");
    // 4. Trả về kết quả dưới dạng JSON
    response.status(200).json(consolidatedList);

  } catch (error) {
    console.error('Lỗi nghiêm trọng trong API export-data:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ khi tổng hợp dữ liệu.', details: error.message });
  }
}