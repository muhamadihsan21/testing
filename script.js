import jsonData from './data.json' assert { type: 'json' };

document.addEventListener('DOMContentLoaded', () => {

    $('#salesTable').DataTable({
      data: jsonData,
      responsive: true,
      scrollX: true,
      scrollY:        500,
      deferRender:    true,
      scroller:       true,
      columns: [
          { data: 'Status' },
          { data: 'Device_ID' },
          { data: 'Location' },
          { data: 'Machine' },
          { data: 'Product' },
          { data: 'Category' },
          { data: 'Transaction' },
          { data: 'TransDate' },
          { data: 'Type' },
          { data: 'RPrice' },
          { data: 'RQty' },
          { data: 'LineTotal' },
          { data: 'TransTotal' }
     ],
    initComplete: function () {
      // Apply initial filter to show only rows with category 'water'
      this.api().column(5).search('water').draw();
  }
  });


   // Ensure the canvas elements exist
   let canvasBar = document.getElementById('chart_divg');
   let canvasPie = document.getElementById('piechart_divg');
   let canvasLine = document.getElementById('linechart_divg');
   let canvasTipe = document.getElementById('pieTipe_divg');

   let ctxLine = canvasLine.getContext('2d');
   let ctxTipe = canvasTipe.getContext('2d');


   if (!canvasBar || !canvasPie) {
       console.error('Canvas elemenctts not found.');
       return;
   }

   // Ensure the contexts are valid
   let ctxBar = canvasBar.getContext('2d');
   let ctxPie = canvasPie.getContext('2d');

   if (!ctxBar || !ctxPie) {
       console.error('Failed to get canvas context.');
       return;
   }

   let hasilFilter = jsonData.filter(item => item.Category === 'Water');
   const combobox = document.getElementById('tipeProduk');
   const uniqueNames = new Set();

   hasilFilter.forEach(item => {
       uniqueNames.add(item.Location);
   });
   uniqueNames.forEach(name => {
       const option = document.createElement('option');
       option.value = name;
       option.textContent = name;
       combobox.appendChild(option);
   });

   // Data untuk diagram batang (penjualan per produk)
   let totalPenjualanPerProdukDanHarga = hasilFilter.reduce((total, item) => {
     if (!total[item.Product]) {
         total[item.Product] = {};
     }
     if (!total[item.Product][item.RPrice]) {
         total[item.Product][item.RPrice] = 0;
     }
     let transTotal = parseFloat(item.RQty);
     if (!isNaN(transTotal)) {
         total[item.Product][item.RPrice] += transTotal;
     }
     return total;
 }, {});
 // Mengurutkan data dari besar ke kecil dan ambil 8 teratas
   let sortedData = Object.entries(totalPenjualanPerProdukDanHarga)
   .flatMap(([product, prices]) => 
       Object.entries(prices).map(([price, qty]) => ({
           label: `${product} (Rp ${price})`,
           value: qty
       }))
   )
   .sort((a, b) => b.value - a.value)
   .slice(0, 8); // Ambil 8 teratas

   // Membuat dataset
  let datasets = [{
     label: 'Total Penjualan',
     data: sortedData.map(item => item.value),
     backgroundColor: sortedData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`),
     borderColor: sortedData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`),
     borderWidth: 1
 }];
   // Data untuk diagram pie (penjualan per lokasi)
   let totalPenjualanPerLokasi = hasilFilter.reduce((total, item) => {
       if (!total[item.Location]) {
           total[item.Location] = 0;
       }
       let transTotal = parseFloat(item.LineTotal);
       if (!isNaN(transTotal)) {
           total[item.Location] += transTotal;
       }
       return total;
   }, {});
   let pieChartData = {
       labels: Object.keys(totalPenjualanPerLokasi),
       datasets: [{
           data: Object.values(totalPenjualanPerLokasi),
           backgroundColor: [
               'rgba(255, 99, 132, 0.2)',
               'rgba(54, 162, 235, 0.2)',
               'rgba(255, 206, 86, 0.2)',
               'rgba(75, 192, 192, 0.2)',
               'rgba(153, 102, 255, 0.2)',
               'rgba(255, 159, 64, 0.2)',
               // tambahkan warna lain sesuai kebutuhan
           ],
           borderColor: [
               'rgba(255, 99, 132, 1)',
               'rgba(54, 162, 235, 1)',
               'rgba(255, 206, 86, 1)',
               'rgba(75, 192, 192, 1)',
               'rgba(153, 102, 255, 1)',
               'rgba(255, 159, 64, 1)',
               // tambahkan warna lain sesuai kebutuhan
           ],
           borderWidth: 1
       }]
   };

   // Membuat bar chart horizontal
   let barChart = new Chart(ctxBar, {
     type: 'bar',
     data: {
         labels: sortedData.map(item => item.label),
         datasets: datasets
     },
     options: {
        responsive: true,
         indexAxis: 'y', // Mengubah orientasi menjadi horizontal
         plugins: {
             legend: {
                 display: true,
                 labels: {
                     generateLabels: function(chart) {
                         return chart.data.labels.map(function(label, index) {
                             return {
                                 text: label, // Gunakan label dari data
                                 fillStyle: chart.data.datasets[0].backgroundColor[index],
                                 strokeStyle: chart.data.datasets[0].borderColor[index],
                                 lineWidth: chart.data.datasets[0].borderWidth
                             };
                         });
                     }
                 }
             }
         },
         scales: {
             x: {
                 beginAtZero: true
             }
         }
         
      }
 });

   // Buat diagram pie
   let pieChart = new Chart(ctxPie, {
       type: 'pie',
       data: pieChartData,
       options: {
           responsive: true,
           plugins: {
               title: {
                   display: true,
                   text: 'Total Penjualan per Lokasi (Kategori Water)'
               }
           }
       }
   });

   

   
    // Prepare data for the line chart (penjualan per produk per bulan di setiap lokasi)
    let totalPenjualanPerTokoPerBulan = hasilFilter.reduce((total, item) => {
       const tahun = item.TransDate.slice(0, 4);
       const bulan = item.TransDate.slice(5, 7);
       const waktu = `${tahun}-${bulan}`;
       const toko = item.Location;
   
       if (!total[waktu]) {
         total[waktu] = {};
       }
       if (!total[waktu][toko]) {
         total[waktu][toko] = 0;
       }
       total[waktu][toko] += parseFloat(item.LineTotal);
   
       return total;
     }, {});
   
     // Ambil semua bulan dan toko yang unik
     const bulanSet = new Set();
     const tokoSet = new Set();
     for (const waktu in totalPenjualanPerTokoPerBulan) {
       bulanSet.add(waktu);
       for (const toko in totalPenjualanPerTokoPerBulan[waktu]) {
         tokoSet.add(toko);
       }
     }
   
     // Urutkan bulan-bulan
     const bulanSorted = Array.from(bulanSet).sort((a, b) => {
       const [tahunA, bulanA] = a.split('-').map(Number);
       const [tahunB, bulanB] = b.split('-').map(Number);
       return tahunA * 12 + bulanA - (tahunB * 12 + bulanB);
     });
   
     // Buat dataset untuk setiap toko
      datasets = Array.from(tokoSet).map(toko => ({
       label: toko,
       data: bulanSorted.map(bulan => totalPenjualanPerTokoPerBulan[bulan]?.[toko] || 0), // Jika tidak ada data, isi dengan 0
       borderColor: getRandomColor(),
       fill: false,
     }));
   
     // Nama-nama bulan
     const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
   
     // Buat grafik garis
       let lineChart = new Chart(ctxLine, {
       type: 'line',
       data: {
         labels: bulanSorted.map(bulan => {
           const [, bulanAngka] = bulan.split('-');
           return namaBulan[parseInt(bulanAngka, 10) - 1]; // Gunakan nama bulan
         }),
         datasets: datasets,
       },
       options: {
         responsive: true,
         scales: {
           y: {
             beginAtZero: true,
           },
         },
         plugins: {
           title: {
             display: true,
             text: 'Total Penjualan per Lokasi per Bulan (Kategori Water)',
           },
         },
       },
     });
   
 

 function getRandomColor() {
   const letters = '0123456789ABCDEF';
   let color = '#';
   for (let i = 0; i < 6; i++) {
     color += letters[Math.floor(Math.random() * 16)];
   }
   return color;
 }

 function applyFilter() {
    // Hancurkan line chart yang sudah ada jika ada
  
   generateChart(ctxBar, ctxPie, hasilFilter, barChart, pieChart, ctxLine, lineChart, ctxTipe, pieChartTipe).then(result => {
     barChart = result.barChart;
     pieChart = result.pieChart;
     lineChart = result.lineChart;
     pieChartTipe = result.pieChartTipe;
   });
}


   let totalTransaksiKeseluruhan = 0;
   hasilFilter.forEach(item => {
     const transTotal = parseFloat(item.RQty);
     if (!isNaN(transTotal)) {
       totalTransaksiKeseluruhan += transTotal;
     }
   });

   
   let totalRevenue = 0;
   hasilFilter.forEach(item => {
     const transTotal = parseFloat(item.LineTotal);
     if (!isNaN(transTotal)) {
       totalRevenue += transTotal;
     }
   });

   let uniqueTransactionsPerPaymentType = new Map();

   hasilFilter.forEach((transaksi) => {
     if (!uniqueTransactionsPerPaymentType.has(transaksi.Type)) {
       uniqueTransactionsPerPaymentType.set(transaksi.Type, new Set());
     }
     uniqueTransactionsPerPaymentType.get(transaksi.Type).add(transaksi.Transaction);
   });
   
   let pieChartTipeData = {
     labels: Array.from(uniqueTransactionsPerPaymentType.keys()),
     datasets: [{
       data: Array.from(uniqueTransactionsPerPaymentType.values(), set => set.size),
       backgroundColor: [
         'rgba(255, 99, 132, 0.2)',
         'rgba(54, 162, 235, 0.2)',
         // tambahkan warna lain sesuai kebutuhan
       ],
       borderColor: [
         'rgba(255, 99, 132, 1)',
         'rgba(54, 162, 235, 1)',
         // tambahkan warna lain sesuai kebutuhan
       ],
       borderWidth: 1
     }]
   };
   
   let pieChartTipe = new Chart(ctxTipe, {
     type: 'pie',
     data: pieChartTipeData,
     options: {
       responsive: true,
       plugins: {
         title: {
           display: true,
         }
       }
     }
   });



document.getElementById('total_revenue').innerText = `$${totalRevenue.toLocaleString()}`;
document.getElementById('total_sales').innerText = `${totalTransaksiKeseluruhan.toLocaleString()}`;

// Panggil fungsi saat halaman dimuat
const greetButton = document.getElementById('generateChartButton');
greetButton.addEventListener('click', applyFilter);


    
    // Handle form submission
    function handleFormSubmit() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        // Create a new list item for the submitted message
        const listItem = document.createElement('li');
        listItem.textContent = ` ${name} : ${message}`;

        // Append the new message to the messages list
        document.getElementById('messages-list').appendChild(listItem);

        // Clear the form fields
        document.getElementById('user-form').reset();

        alert('Your comment has been successfully entered!');
    }

    // Filter content based on dropdown selection
    function filterContent(category) {
        const items = document.querySelectorAll('#box-container > div');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Sort content function based on selected criteria
    function sortContent(criteria) {
        const container = document.getElementById('box-container');
        const items = Array.from(container.children);

        switch(criteria) {
            case 'content':
                items.sort((a, b) => a.textContent.localeCompare(b.textContent));
                break;
            case 'category':
                items.sort((a, b) => a.dataset.category.localeCompare(b.dataset.category));
                break;
            default:
                items.sort((a, b) => parseInt(a.className.match(/\d+/)[0]) - parseInt(b.className.match(/\d+/)[0]));
                break;
        }

        items.forEach(item => container.appendChild(item));
    }

    // Initial sort to demonstrate functionality
    sortContent('default');
});

function generateChart(ctxBar, ctxPie, filteredData, existingBarChart, existingPieChart, ctxLine, existingLineChart, ctxTipe, existingpieChartTipe ) {
  return new Promise((resolve, reject) => {
    const quartilSelect = document.getElementById('quartilSelect');
    const tipeSelect = document.getElementById('tipeSelect');
    const combobox = document.getElementById('tipeProduk');
    const selectedProduk = combobox.value;
    const selectedTipe = tipeSelect.value;

    // Hancurkan grafik yang ada jika ada
    if (existingBarChart) {
      existingBarChart.destroy();
    }
    if (existingPieChart) {
      existingPieChart.destroy();
    }
    if (existingLineChart) {
      existingLineChart.destroy();
  }
    if (existingpieChartTipe) {
      existingpieChartTipe.destroy();
  }

    const selectedQuartil = quartilSelect.value;
    const quartilRanges = {
      'Q1': { start: new Date('2022-01-01'), end: new Date('2022-03-31') },
      'Q2': { start: new Date('2022-04-01'), end: new Date('2022-06-30') },
      'Q3': { start: new Date('2022-07-01'), end: new Date('2022-09-30') },
      'Q4': { start: new Date('2022-10-01'), end: new Date('2022-12-31') }
    };

    const selectedRange = selectedQuartil !== 'Semua' ? quartilRanges[selectedQuartil] : null;
    const startDate = selectedRange?.start;
    const endDate = selectedRange?.end;

    const filteredData1 = filteredData.filter(item => {
      const itemDate = new Date(item.TransDate);
      return (
        (selectedQuartil === 'Semua' || (itemDate >= startDate && itemDate <= endDate)) &&
        (selectedTipe === 'Semua' || item.Type === selectedTipe) &&
        (selectedProduk === 'Semua' || item.Location === selectedProduk)
      );
    });

    console.log("Filtered Data:", filteredData1);

 

  const totalPenjualanPerProdukDanHarga = {};
  const totalPenjualanPerLokasi = {};
  
  filteredData1.forEach(item => {
    const product = item.Product;
    const price = item.RPrice;
    const location = item.Location;
    const transTotal = parseFloat(item.RQty);
  
    if (!isNaN(transTotal)) {
      if (!totalPenjualanPerProdukDanHarga[product]) {
        totalPenjualanPerProdukDanHarga[product] = {};
      }
      totalPenjualanPerProdukDanHarga[product][price] = (totalPenjualanPerProdukDanHarga[product][price] || 0) + transTotal;
      totalPenjualanPerLokasi[location] = (totalPenjualanPerLokasi[location] || 0) + parseFloat(item.LineTotal);
    }
  });
  
  let sortedData = Object.entries(totalPenjualanPerProdukDanHarga)
    .flatMap(([product, prices]) =>
      Object.entries(prices).map(([price, qty]) => ({
        label: `${product} (Rp ${price})`,
        value: qty
      }))
    )
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Ambil 8 teratas
  
  let barChartData = {
    labels: sortedData.map(item => item.label),
    datasets: [{
      responsive: true,
      label: 'Total Penjualan',
      data: sortedData.map(item => item.value),
      backgroundColor: sortedData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`),
      borderColor: sortedData.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`),
      borderWidth: 1
    }]
  };
  
  let pieChartData = {
    labels: Object.keys(totalPenjualanPerLokasi),
    datasets: [{
      data: Object.values(totalPenjualanPerLokasi),
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        // tambahkan warna lain sesuai kebutuhan
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        // tambahkan warna lain sesuai kebutuhan
      ],
      borderWidth: 1
    }]
  };
  
  let newBarChart = new Chart(ctxBar, {
    type: 'bar',
    data: barChartData,
    options: {
      responsive: true,
      indexAxis: 'y', // Mengubah orientasi menjadi horizontal
      plugins: {
        legend: {
          display: true,
          labels: {
            generateLabels: function(chart) {
              return chart.data.labels.map(function(label, index) {
                return {
                  text: label, // Gunakan label dari data
                  fillStyle: chart.data.datasets[0].backgroundColor[index],
                  strokeStyle: chart.data.datasets[0].borderColor[index],
                  lineWidth: chart.data.datasets[0].borderWidth
                };
              });
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
  
  let newPieChart = new Chart(ctxPie, {
    type: 'pie',
    data: pieChartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Total Penjualan per Lokasi (Kategori Water)'
        }
      }
    }
  });
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
 
    // Update data untuk line chart
    const totalPenjualanPerTokoPerBulan = filteredData1.reduce((total, item) => {
      const tahun = item.TransDate.slice(0, 4);
      const bulan = item.TransDate.slice(5, 7);
      const waktu = `${tahun}-${bulan}`;
      const toko = item.Location;

      if (!total[waktu]) {
          total[waktu] = {};
      }
      if (!total[waktu][toko]) {
          total[waktu][toko] = 0;
      }
      total[waktu][toko] += parseFloat(item.TransTotal);

      return total;
  }, {});

  let totalTransaksiKeseluruhan = 0;
  filteredData1.forEach(item => {
    const transTotal = parseFloat(item.RQty);
    if (!isNaN(transTotal)) {
      totalTransaksiKeseluruhan += transTotal;
    }
  });

  
  let totalRevenue = 0;
  filteredData1.forEach(item => {
    const transTotal = parseFloat(item.LineTotal);
    if (!isNaN(transTotal)) {
      totalRevenue += transTotal;
    }
  });

  console.log(totalRevenue);


  document.getElementById('total_revenue').innerText = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('total_sales').innerText = `${totalTransaksiKeseluruhan.toLocaleString()}`;

  // Ambil semua bulan dan toko yang unik dari filteredLineData
  const bulanSet = new Set();
  const tokoSet = new Set();
  for (const waktu in totalPenjualanPerTokoPerBulan) {
      bulanSet.add(waktu);
      for (const toko in totalPenjualanPerTokoPerBulan[waktu]) {
          tokoSet.add(toko);
      }
  }

  // Urutkan bulan-bulan
  const bulanSorted = Array.from(bulanSet).sort((a, b) => {
      const [tahunA, bulanA] = a.split('-').map(Number);
      const [tahunB, bulanB] = b.split('-').map(Number);
      return tahunA * 12 + bulanA - (tahunB * 12 + bulanB);
  });

  // Buat line chart baru
  const newLineChart = new Chart(ctxLine, {
      type: 'line',
      data: {
          labels: bulanSorted.map(bulan => {
              const [, bulanAngka] = bulan.split('-');
              return namaBulan[parseInt(bulanAngka, 10) - 1]; 
          }),
          datasets: Array.from(tokoSet).map(toko => ({
              label: toko,
              data: bulanSorted.map(bulan => totalPenjualanPerTokoPerBulan[bulan]?.[toko] ?? 0), 
              borderColor: getRandomColor(), 
              fill: false,
          })),
      },
      options: {
          // ... (opsi line chart lainnya) ...
      },
      });
    
    
  let uniqueTransactionsPerPaymentType = new Map();

  filteredData1.forEach((transaksi) => {
    if (!uniqueTransactionsPerPaymentType.has(transaksi.Type)) {
      uniqueTransactionsPerPaymentType.set(transaksi.Type, new Set());
    }
    uniqueTransactionsPerPaymentType.get(transaksi.Type).add(transaksi.Transaction);
  });
  
  let pieChartTipeData = {
    labels: Array.from(uniqueTransactionsPerPaymentType.keys()),
    datasets: [{
      data: Array.from(uniqueTransactionsPerPaymentType.values(), set => set.size),
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        // tambahkan warna lain sesuai kebutuhan
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        // tambahkan warna lain sesuai kebutuhan
      ],
      borderWidth: 1
    }]
  };
  
  let newPieChartTipe = new Chart(ctxTipe, {
    type: 'pie',
    data: pieChartTipeData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
        }
      }
    }
  });

          resolve({ barChart: newBarChart, pieChart: newPieChart, lineChart: newLineChart, pieChartTipe:  newPieChartTipe});

  });
  
  
}


function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

