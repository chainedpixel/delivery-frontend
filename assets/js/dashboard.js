import Config from "./config.js";
//descomentar cuando ya funcione la api
//import apiclient from "./utils/apiclient.js";

document.addEventListener('DOMContentLoaded', function() {
    // inicializar tooltips
    tippy('[data-tippy-content]', {
        theme: 'light',
        arrow: true
    });

    const companyData = {
        active_branches: 5,
        average_delivery_time: 45.5,
        cancelled_orders: 50,
        completed_orders: 1100,
        delivery_success_rate: 88,
        total_orders: 1250,
        total_revenue: 25000.5,
        unique_customers: 500,
        branches: [
            {
                code: "SUC-NORTE-001",
                company_name: "Express Delivery Co.",
                contact_email: "norte@expressdelivery.com",
                contact_name: "Gerente Norte",
                contact_phone: "+573001112233",
                created_at: "2025-04-03T05:31:52.053Z",
                status: "active",
                orders: 320,
                latitude:13.701317,
                longitude: -89.189269
            },
            {
                code: "SUC-SUR-002",
                company_name: "Express Delivery Co.",
                contact_email: "sur@expressdelivery.com",
                contact_name: "Gerente Sur",
                contact_phone: "+573004445566",
                created_at: "2025-04-02T10:15:22.053Z",
                status: "active",
                orders: 280,
                latitude: 13.815412,
                longitude: -88.862874
            },
            {
                code: "SUC-CENTRO-003",
                company_name: "Express Delivery Co.",
                contact_email: "centro@expressdelivery.com",
                contact_name: "Gerente Centro",
                contact_phone: "+573007778899",
                created_at: "2025-03-28T08:45:10.053Z",
                status: "active",
                orders: 410,
                latitude:13.836075,
                longitude: -89.438594
            }
        ]
    };

    // actualizar métricas
    document.getElementById('total-orders').textContent = companyData.total_orders.toLocaleString();
    document.getElementById('completed-orders').textContent = companyData.completed_orders.toLocaleString();
    document.getElementById('success-rate').textContent = companyData.delivery_success_rate + '%';
    document.getElementById('total-revenue').textContent = '$' + companyData.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('avg-delivery-time').textContent = companyData.average_delivery_time;
    document.getElementById('active-branches').textContent = companyData.active_branches;
    document.getElementById('unique-customers').textContent = companyData.unique_customers;

    // gpedidos por día
    const ordersCtx = document.getElementById('orders-chart').getContext('2d');
    const ordersChart = new Chart(ordersCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 30}, (_, i) => `${i+1} Abr`),
            datasets: [{
                label: 'Pedidos',
                data: Array.from({length: 30}, () => Math.floor(Math.random() * 100) + 20),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // pedidos
    const distributionCtx = document.getElementById('orders-distribution-chart').getContext('2d');
    const distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completados', 'Cancelados', 'En proceso'],
            datasets: [{
                data: [companyData.completed_orders, companyData.cancelled_orders, companyData.total_orders - companyData.completed_orders - companyData.cancelled_orders],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#f59e0b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });

    // tiempo de entrega
    const deliveryTimeCtx = document.getElementById('delivery-time-chart').getContext('2d');
    const deliveryTimeChart = new Chart(deliveryTimeCtx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Minutos',
                data: [48, 42, 45, 47, 43, 46, 44],
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 30,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    //  sucursales
    const branchesCtx = document.getElementById('branches-chart').getContext('2d');
    const branchesChart = new Chart(branchesCtx, {
        type: 'radar',
        data: {
            labels: companyData.branches.map(b => b.code),
            datasets: [{
                label: 'Pedidos',
                data: companyData.branches.map(b => b.orders),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 500
                }
            }
        }
    });

    // clientes
    const customersCtx = document.getElementById('customers-chart').getContext('2d');
    const customersChart = new Chart(customersCtx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Clientes nuevos',
                data: [35, 42, 48, 55, 60, 65, 70, 75, 80, 85, 90, 95],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // filtros de tiempo
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-filter-btn').forEach(b => {b.classList.remove('active');b.classList.remove('bg-purple-300')});
            this.classList.add('active');
            this.classList.add('bg-purple-300');
            
            // aquí deberías actualizar los datos del gráfico según el período seleccionado
            const period = parseInt(this.dataset.period);
            ordersChart.data.labels = Array.from({length: period}, (_, i) => `${i+1} Abr`);
            ordersChart.data.datasets[0].data = Array.from({length: period}, () => Math.floor(Math.random() * 100) + 20);
            ordersChart.update();
        });
    });

    // boto de actualizar
    document.getElementById('refresh-dashboard').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando';
        
        // simular carga de datos
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Actualizar';
            
            // mostrar notificación de éxito
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg';
            toast.textContent = 'Datos actualizados correctamente';
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 3000);
        }, 1500);
    });

 
    //  pestañas
    document.querySelectorAll('.tab-sidebar').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // remover clase active de todos los tabs
            document.querySelectorAll('.tab-sidebar').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-sidebar').forEach(t => t.classList.remove('bg-blue-200'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // agregar clase active al tab seleccionado
            this.classList.add('active');
            this.classList.add('bg-blue-200');
            
            // mostrar el contenido correspondiente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            if(map)
                setTimeout(() => {
                    map.resize();
                }, 100);
        });
    });

    // inicializar mapa de sucursales
    mapboxgl.accessToken = Config.MAPBOX.token;
    const map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: Config.MAPBOX.mapInitialCoords, 
        zoom: Config.MAPBOX.mapZoomMultiplePoint
    });

    // añadir marcadores para cada sucursal
    companyData.branches.forEach(branch => {
        // crear un elemento html personalizado para el marcador
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = 'url(../../assets/img/pin.png)';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = '100%';

        // añadir el marcador al mapa
        new mapboxgl.Marker(el)
            .setLngLat([branch.longitude, branch.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${branch.code}</h3><p>${branch.company_name}</p>`))
            .addTo(map);
    });

    // eventos para la lista de sucursales en el mapa
    document.querySelectorAll('.branch-list-item').forEach(item => {
        item.addEventListener('click', function() {
            // remover clase active de todos los items
            document.querySelectorAll('.branch-list-item').forEach(i => i.classList.remove('active'));
            
            // agregar clase active al item seleccionado
            this.classList.add('active');
            
            // centrar el mapa en la sucursal seleccionada
            const lat = parseFloat(this.getAttribute('data-lat'));
            const lon = parseFloat(this.getAttribute('data-lon'));
            map.flyTo({
                center: [lon, lat],
                zoom: Config.MAPBOX.mapZoom,
                essential: true
            });
        });
    });
});
