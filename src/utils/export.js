import * as XLSX from 'xlsx';

/**
 * Exports JSON data to an Excel file (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Hoja1') => {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Buffer and Save
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
