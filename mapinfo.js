// Initialize map (Centered on India)
var map = L.map('map', {
    zoomControl: false 
}).setView([22.5, 79.0], 5);

L.control.zoom({ position: 'topleft' }).addTo(map);

// Stadia Maps Light Theme
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 20
}).addTo(map);

const colors = {
    'Wildfire / Forest Fire': '#10B981',    
    'Industrial Fire': '#EF4444',  
    'Persistent Industrial Activity': '#F59E0B',  
    'Mining Activity': '#3B82F6',      
    'Stubble Burning': '#8B5CF6',
    'Uncertain / Ambiguous Event': '#4B5563' 
};

// 100 Real Clusters Extracted from Python Notebook
const fireData = [
    { lat: 21.56127, lng: 76.43035, id: 'CLST_202604_N20_20479', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.79845, lng: 83.677, id: 'CLST_202604_N20_33206', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.77774, lng: 77.08861, id: 'CLST_202604_N20_41586', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.9334, lng: 76.11311, id: 'CLST_202604_N20_30577', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 29.63901, lng: 80.00315, id: 'CLST_202604_N20_35332', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.43979, lng: 82.10184, id: 'CLST_202604_N20_12267', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.27646, lng: 81.08205, id: 'CLST_202604_N20_20089', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.13306, lng: 80.93082, id: 'CLST_202604_N20_46703', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.96754, lng: 94.64764, id: 'CLST_202604_N20_4524', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.25041, lng: 84.02064, id: 'CLST_202604_N20_35958', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.28115, lng: 78.58684, id: 'CLST_202604_N20_12407', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.77376, lng: 76.29042, id: 'CLST_202604_N20_30660', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.1566, lng: 93.98552, id: 'CLST_202604_N20_20326', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64355, lng: 75.08227, id: 'CLST_202604_N20_16599', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.29643, lng: 76.17354, id: 'CLST_202604_N20_27368', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.63892, lng: 81.82675, id: 'CLST_202604_N20_26888', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.01591, lng: 95.04232, id: 'CLST_202604_N20_9931', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.10088, lng: 78.70748, id: 'CLST_202604_N20_39048', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.67607, lng: 84.80702, id: 'CLST_202604_N20_43050', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.82852, lng: 73.88626, id: 'CLST_202604_N20_3378', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.71357, lng: 69.80398, id: 'CLST_202604_N20_47049', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.80482, lng: 95.57396, id: 'CLST_202604_N20_13996', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.08709, lng: 93.82086, id: 'CLST_202604_N20_24676', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.71234, lng: 78.46653, id: 'CLST_202604_N20_8297', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.60753, lng: 97.03654, id: 'CLST_202604_N20_12037', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.98802, lng: 77.5539, id: 'CLST_202604_N20_29570', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.87438, lng: 82.8826, id: 'CLST_202604_N20_23034', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.73698, lng: 96.2806, id: 'CLST_202604_N20_27774', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.44142, lng: 82.68111, id: 'CLST_202604_N20_31333', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.44742, lng: 81.36862, id: 'CLST_202604_N20_36567', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.33949, lng: 79.12571, id: 'CLST_202604_N20_33322', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.59391, lng: 85.30068, id: 'CLST_202604_N20_46599', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.3269, lng: 80.31603, id: 'CLST_202604_N20_12512', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.26697, lng: 76.44706, id: 'CLST_202604_N20_33914', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.0779, lng: 79.02576, id: 'CLST_202604_N20_44930', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.20678, lng: 93.48912, id: 'CLST_202604_N20_4336', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.05672, lng: 83.49539, id: 'CLST_202604_N20_15019', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.6533, lng: 73.39015, id: 'CLST_202604_N20_21549', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.76062, lng: 81.29486, id: 'CLST_202604_N20_22585', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.58006, lng: 97.67718, id: 'CLST_202604_N20_4678', cls: 'Wildfire / Forest Fire', score: '0.65', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.20231, lng: 76.89534, id: 'CLST_202604_N20_32985', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.1091, lng: 93.46784, id: 'CLST_202604_N20_24923', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.10902, lng: 93.43771, id: 'CLST_202604_N20_9701', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.2114, lng: 79.00543, id: 'CLST_202604_N20_5227', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.7853, lng: 83.99767, id: 'CLST_202604_N20_27134', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 29.94588, lng: 74.21597, id: 'CLST_202604_N20_46897', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.09564, lng: 95.81282, id: 'CLST_202604_N20_9403', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.47884, lng: 77.87694, id: 'CLST_202604_N20_34604', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.39022, lng: 84.26959, id: 'CLST_202604_N20_35527', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.51669, lng: 94.14102, id: 'CLST_202604_N20_27088', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.95802, lng: 78.27455, id: 'CLST_202604_N20_9828', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64287, lng: 79.58125, id: 'CLST_202604_N20_41206', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.03636, lng: 73.80983, id: 'CLST_202604_N20_5329', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 30.43977, lng: 78.13131, id: 'CLST_202604_N20_35424', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.15032, lng: 83.77877, id: 'CLST_202604_N20_37600', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.53021, lng: 77.37831, id: 'CLST_202604_N20_26454', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.60078, lng: 76.63508, id: 'CLST_202604_N20_17411', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 18.72338, lng: 80.39281, id: 'CLST_202604_N20_15878', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.82849, lng: 93.42279, id: 'CLST_202604_N20_26768', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.01823, lng: 77.38857, id: 'CLST_202604_N20_33267', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.01578, lng: 74.0092, id: 'CLST_202604_N20_23311', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.77956, lng: 84.09886, id: 'CLST_202604_N20_33470', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 16.22798, lng: 94.84524, id: 'CLST_202604_N20_44986', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.47973, lng: 80.66838, id: 'CLST_202604_N20_27239', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.21088, lng: 96.47292, id: 'CLST_202604_N20_37142', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.38967, lng: 83.97216, id: 'CLST_202604_N20_39647', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.07728, lng: 81.97531, id: 'CLST_202604_N20_46748', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.91581, lng: 75.59493, id: 'CLST_202604_N20_11396', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.82776, lng: 83.91483, id: 'CLST_202604_N20_22756', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.48566, lng: 94.81962, id: 'CLST_202604_N20_18809', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.84601, lng: 85.37543, id: 'CLST_202604_N20_42732', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.79536, lng: 85.01224, id: 'CLST_202604_N20_33242', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.86715, lng: 76.02285, id: 'CLST_202604_N20_23584', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.03829, lng: 77.90187, id: 'CLST_202604_N20_17112', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.8586, lng: 96.43188, id: 'CLST_202604_N20_28934', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.8182, lng: 82.50906, id: 'CLST_202604_N20_0949', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 18.19863, lng: 97.43131, id: 'CLST_202604_N20_10859', cls: 'Wildfire / Forest Fire', score: '0.81', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.09541, lng: 93.4985, id: 'CLST_202604_N20_29985', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.56622, lng: 78.57682, id: 'CLST_202604_N20_46053', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.33303, lng: 81.98374, id: 'CLST_202604_N20_43992', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 32.2906, lng: 70.74039, id: 'CLST_202604_N20_7431', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.78229, lng: 93.49264, id: 'CLST_202604_N20_22339', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.94911, lng: 78.85115, id: 'CLST_202604_N20_13791', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.04234, lng: 77.86906, id: 'CLST_202604_N20_13797', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.25604, lng: 96.40321, id: 'CLST_202604_N20_13920', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.3966, lng: 83.53546, id: 'CLST_202604_N20_15158', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.43801, lng: 80.86329, id: 'CLST_202604_N20_16064', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.19225, lng: 77.2096, id: 'CLST_202604_N20_20576', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.49813, lng: 75.5519, id: 'CLST_202604_N20_47489', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.93596, lng: 81.70451, id: 'CLST_202604_N20_7544', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 16.64999, lng: 95.4587, id: 'CLST_202604_N20_13905', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.65666, lng: 80.00364, id: 'CLST_202604_N20_25527', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.29707, lng: 77.21832, id: 'CLST_202604_N20_41122', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 27.84826, lng: 82.2274, id: 'CLST_202604_N20_40084', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.99338, lng: 84.75083, id: 'CLST_202604_N20_34390', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.16505, lng: 79.52517, id: 'CLST_202604_N20_36233', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.5351, lng: 75.80937, id: 'CLST_202604_N20_33008', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.28478, lng: 97.8023, id: 'CLST_202604_N20_12969', cls: 'Wildfire / Forest Fire', score: '0.65', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.61125, lng: 80.71544, id: 'CLST_202604_N20_14381', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.964, lng: 96.2244, id: 'CLST_202604_N20_23934', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' }
];

        const bottomPanel = document.getElementById('bottom-panel');
        const tdId = document.getElementById('td-id');
        const tdCoords = document.getElementById('td-coords');
        const tdClass = document.getElementById('td-class');
        const tdScore = document.getElementById('td-score');
        const tdPath = document.getElementById('td-path');

        function closePanel() {
            bottomPanel.style.display = 'none';
            map.closePopup();
        }

        // Plot markers
        fireData.forEach(data => {
            const markerColor = colors[data.cls] || '#1F2937';
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="width: 100%; height: 100%; border-radius: 50%; background-color: ${markerColor};"></div>`,
                iconSize: [15, 15],
                iconAnchor: [8, 8],
                popupAnchor: [0, -10]
            });

            const marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(map);
            
            marker.bindPopup("Viewing this", { closeButton: false });

            marker.on('click', function (e) {
                this.openPopup();
                
                tdId.innerText = data.id;
                tdCoords.innerText = `${data.lat}, ${data.lng}`;
                tdClass.innerText = data.cls;
                tdScore.innerText = data.score;
                tdPath.innerHTML = `<span class="${data.badge}">${data.path}</span>`;
                
                bottomPanel.style.display = 'block';
            });
        });
