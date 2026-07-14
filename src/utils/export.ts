export const exportToCSV = (filename: string, headers: string[], data: (string | number)[][]) => {
  // Adiciona BOM (Byte Order Mark) para garantir que o Excel reconheça o UTF-8
  const BOM = "\uFEFF";
  
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let str = String(val !== null && val !== undefined ? val : "");
      // Escapa aspas duplas
      str = str.replace(/"/g, '""');
      // Envolve em aspas se contiver ponto-e-vírgula, vírgula, nova linha ou aspas
      if (str.search(/("|,|\n|;)/g) >= 0) {
        str = `"${str}"`;
      }
      return str;
    }).join(";"); // Usa ponto-e-vírgula (;) pois é o padrão no Excel em pt-BR
  };

  const csvContent = BOM + [
    processRow(headers),
    ...data.map(processRow)
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
