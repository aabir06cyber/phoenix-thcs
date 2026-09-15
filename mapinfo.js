// Initialize map (Centered on Central India)
var map = L.map('map', {
    zoomControl: false 
}).setView([21.5, 79.0], 5);

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

// 250 Real Clusters Extracted strictly inside India from clusters_final_gee_ndvi.csv
const fireData = [
    { lat: 21.56127, lng: 76.43035, id: 'CLST_202604_N20_20479', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.79845, lng: 83.677, id: 'CLST_202604_N20_33206', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.77774, lng: 77.08861, id: 'CLST_202604_N20_41586', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.9334, lng: 76.11311, id: 'CLST_202604_N20_30577', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 29.63901, lng: 80.00315, id: 'CLST_202604_N20_35332', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.43979, lng: 82.10184, id: 'CLST_202604_N20_12267', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.27646, lng: 81.08205, id: 'CLST_202604_N20_20089', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.13306, lng: 80.93082, id: 'CLST_202604_N20_46703', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.25041, lng: 84.02064, id: 'CLST_202604_N20_35958', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.28115, lng: 78.58684, id: 'CLST_202604_N20_12407', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.77376, lng: 76.29042, id: 'CLST_202604_N20_30660', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64355, lng: 75.08227, id: 'CLST_202604_N20_16599', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.29643, lng: 76.17354, id: 'CLST_202604_N20_27368', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.63892, lng: 81.82675, id: 'CLST_202604_N20_26888', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.10088, lng: 78.70748, id: 'CLST_202604_N20_39048', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.67607, lng: 84.80702, id: 'CLST_202604_N20_43050', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.82852, lng: 73.88626, id: 'CLST_202604_N20_3378', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.71357, lng: 69.80398, id: 'CLST_202604_N20_47049', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.71234, lng: 78.46653, id: 'CLST_202604_N20_8297', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.98802, lng: 77.5539, id: 'CLST_202604_N20_29570', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.87438, lng: 82.8826, id: 'CLST_202604_N20_23034', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.44142, lng: 82.68111, id: 'CLST_202604_N20_31333', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.44742, lng: 81.36862, id: 'CLST_202604_N20_36567', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.33949, lng: 79.12571, id: 'CLST_202604_N20_33322', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.59391, lng: 85.30068, id: 'CLST_202604_N20_46599', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.3269, lng: 80.31603, id: 'CLST_202604_N20_12512', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.26697, lng: 76.44706, id: 'CLST_202604_N20_33914', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.0779, lng: 79.02576, id: 'CLST_202604_N20_44930', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.05672, lng: 83.49539, id: 'CLST_202604_N20_15019', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.6533, lng: 73.39015, id: 'CLST_202604_N20_21549', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.76062, lng: 81.29486, id: 'CLST_202604_N20_22585', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.20231, lng: 76.89534, id: 'CLST_202604_N20_32985', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 14.2114, lng: 79.00543, id: 'CLST_202604_N20_5227', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.7853, lng: 83.99767, id: 'CLST_202604_N20_27134', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.47884, lng: 77.87694, id: 'CLST_202604_N20_34604', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.39022, lng: 84.26959, id: 'CLST_202604_N20_35527', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.95802, lng: 78.27455, id: 'CLST_202604_N20_9828', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64287, lng: 79.58125, id: 'CLST_202604_N20_41206', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.03636, lng: 73.80983, id: 'CLST_202604_N20_5329', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 30.43977, lng: 78.13131, id: 'CLST_202604_N20_35424', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.15032, lng: 83.77877, id: 'CLST_202604_N20_37600', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.53021, lng: 77.37831, id: 'CLST_202604_N20_26454', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.60078, lng: 76.63508, id: 'CLST_202604_N20_17411', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 18.72338, lng: 80.39281, id: 'CLST_202604_N20_15878', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 28.01823, lng: 77.38857, id: 'CLST_202604_N20_33267', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.01578, lng: 74.0092, id: 'CLST_202604_N20_23311', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.77956, lng: 84.09886, id: 'CLST_202604_N20_33470', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.47973, lng: 80.66838, id: 'CLST_202604_N20_27239', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.38967, lng: 83.97216, id: 'CLST_202604_N20_39647', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.07728, lng: 81.97531, id: 'CLST_202604_N20_46748', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.91581, lng: 75.59493, id: 'CLST_202604_N20_11396', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.82776, lng: 83.91483, id: 'CLST_202604_N20_22756', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.84601, lng: 85.37543, id: 'CLST_202604_N20_42732', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 27.79536, lng: 85.01224, id: 'CLST_202604_N20_33242', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.86715, lng: 76.02285, id: 'CLST_202604_N20_23584', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.03829, lng: 77.90187, id: 'CLST_202604_N20_17112', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.8182, lng: 82.50906, id: 'CLST_202604_N20_0949', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.56622, lng: 78.57682, id: 'CLST_202604_N20_46053', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.33303, lng: 81.98374, id: 'CLST_202604_N20_43992', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 32.2906, lng: 70.74039, id: 'CLST_202604_N20_7431', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.94911, lng: 78.85115, id: 'CLST_202604_N20_13791', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.04234, lng: 77.86906, id: 'CLST_202604_N20_13797', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.3966, lng: 83.53546, id: 'CLST_202604_N20_15158', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.43801, lng: 80.86329, id: 'CLST_202604_N20_16064', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.19225, lng: 77.2096, id: 'CLST_202604_N20_20576', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.49813, lng: 75.5519, id: 'CLST_202604_N20_47489', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.93596, lng: 81.70451, id: 'CLST_202604_N20_7544', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.65666, lng: 80.00364, id: 'CLST_202604_N20_25527', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.29707, lng: 77.21832, id: 'CLST_202604_N20_41122', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 27.84826, lng: 82.2274, id: 'CLST_202604_N20_40084', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.99338, lng: 84.75083, id: 'CLST_202604_N20_34390', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.16505, lng: 79.52517, id: 'CLST_202604_N20_36233', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.5351, lng: 75.80937, id: 'CLST_202604_N20_33008', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.61125, lng: 80.71544, id: 'CLST_202604_N20_14381', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.86472, lng: 77.49168, id: 'CLST_202604_N20_21092', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.68817, lng: 73.80537, id: 'CLST_202604_N20_2615', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.26127, lng: 80.5925, id: 'CLST_202604_N20_4464', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.5878, lng: 80.95764, id: 'CLST_202604_N20_26896', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.02538, lng: 82.50369, id: 'CLST_202604_N20_32508', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.06733, lng: 83.21045, id: 'CLST_202604_N20_24741', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.65751, lng: 81.39129, id: 'CLST_202604_N20_12683', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.30138, lng: 85.04419, id: 'CLST_202604_N20_28957', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05374, lng: 81.33235, id: 'CLST_202604_N20_16569', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.39806, lng: 83.56041, id: 'CLST_202604_N20_15161', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.3496, lng: 83.16016, id: 'CLST_202604_N20_26894', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.31427, lng: 81.36536, id: 'CLST_202604_N20_41932', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.04639, lng: 83.1895, id: 'CLST_202604_N20_24744', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.13251, lng: 77.29177, id: 'CLST_202604_N20_41257', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.36437, lng: 80.95764, id: 'CLST_202604_N20_47492', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65215, lng: 81.82675, id: 'CLST_202604_N20_26889', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.13251, lng: 81.36536, id: 'CLST_202604_N20_42950', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.35416, lng: 84.71761, id: 'CLST_202604_N20_23237', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.65751, lng: 84.76785, id: 'CLST_202604_N20_38623', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.36437, lng: 81.68777, id: 'CLST_202604_N20_43871', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.46328, lng: 81.42761, id: 'CLST_202604_N20_44664', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.33644, lng: 82.68961, id: 'CLST_202604_N20_21694', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.31427, lng: 80.84723, id: 'CLST_202604_N20_46949', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.56371, lng: 81.33235, id: 'CLST_202604_N20_45232', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.54129, lng: 84.66842, id: 'CLST_202604_N20_37718', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.18501, lng: 81.25998, id: 'CLST_202604_N20_44101', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.28591, lng: 81.36536, id: 'CLST_202604_N20_44780', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.73458, lng: 84.58152, id: 'CLST_202604_N20_39010', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.36437, lng: 81.42761, id: 'CLST_202604_N20_45000', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.79255, lng: 81.68777, id: 'CLST_202604_N20_45891', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.63821, lng: 75.05608, id: 'CLST_202604_N20_16597', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.18349, lng: 82.50369, id: 'CLST_202604_N20_32509', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.95353, lng: 78.85115, id: 'CLST_202604_N20_13792', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.68652, lng: 84.80702, id: 'CLST_202604_N20_43051', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65215, lng: 81.80211, id: 'CLST_202604_N20_26890', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.71234, lng: 78.49071, id: 'CLST_202604_N20_8298', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.87438, lng: 82.85966, id: 'CLST_202604_N20_23035', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64287, lng: 79.55393, id: 'CLST_202604_N20_41205', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.01823, lng: 77.41249, id: 'CLST_202604_N20_33268', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.86715, lng: 75.99846, id: 'CLST_202604_N20_23583', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.47884, lng: 77.85172, id: 'CLST_202604_N20_34603', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.07728, lng: 81.99912, id: 'CLST_202604_N20_46749', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.94588, lng: 74.24151, id: 'CLST_202604_N20_46898', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.19225, lng: 77.18524, id: 'CLST_202604_N20_20575', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.38967, lng: 83.99616, id: 'CLST_202604_N20_39648', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.95802, lng: 78.29828, id: 'CLST_202604_N20_9829', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.91581, lng: 75.61908, id: 'CLST_202604_N20_11397', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.01578, lng: 73.98471, id: 'CLST_202604_N20_23310', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.56622, lng: 78.55291, id: 'CLST_202604_N20_46052', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.04234, lng: 77.89312, id: 'CLST_202604_N20_13798', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.03829, lng: 77.92557, id: 'CLST_202604_N20_17113', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.15032, lng: 83.75476, id: 'CLST_202604_N20_37599', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.84601, lng: 85.35246, id: 'CLST_202604_N20_42731', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.5351, lng: 75.83401, id: 'CLST_202604_N20_33009', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.06733, lng: 83.1895, id: 'CLST_202604_N20_24740', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.76062, lng: 81.31971, id: 'CLST_202604_N20_22586', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.04639, lng: 83.16853, id: 'CLST_202604_N20_24743', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.77376, lng: 76.26578, id: 'CLST_202604_N20_30659', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.5878, lng: 80.98226, id: 'CLST_202604_N20_26897', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.78069, lng: 85.47648, id: 'CLST_202604_N20_10016', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.64999, lng: 75.48398, id: 'CLST_202604_N20_13906', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.02538, lng: 82.47919, id: 'CLST_202604_N20_32507', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.86664, lng: 77.07357, id: 'CLST_202604_N20_10065', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.20231, lng: 76.87103, id: 'CLST_202604_N20_32984', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.07667, lng: 78.77708, id: 'CLST_202604_N20_10070', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.59263, lng: 75.18873, id: 'CLST_202604_N20_10022', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.296, lng: 85.8488, id: 'CLST_202604_N20_10022', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.17, lng: 72.85536, id: 'CLST_202604_N20_10019', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.17461, lng: 84.09341, id: 'CLST_202604_N20_10047', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.082, lng: 80.2946, id: 'CLST_202604_N20_10006', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.572, lng: 88.38792, id: 'CLST_202604_N20_10007', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.52, lng: 73.88057, id: 'CLST_202604_N20_10010', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 31.19986, lng: 78.87754, id: 'CLST_202604_N20_10096', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 12.76615, lng: 76.25032, id: 'CLST_202604_N20_10052', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.75694, lng: 71.93393, id: 'CLST_202604_N20_10056', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.23384, lng: 79.31046, id: 'CLST_202604_N20_10057', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 10.60552, lng: 75.34706, id: 'CLST_202604_N20_10080', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.42059, lng: 75.31976, id: 'CLST_202604_N20_10084', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.6139, lng: 77.23363, id: 'CLST_202604_N20_10043', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.54167, lng: 76.87352, id: 'CLST_202604_N20_10049', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.42291, lng: 79.47094, id: 'CLST_202604_N20_10075', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.846, lng: 80.97087, id: 'CLST_202604_N20_10012', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.61466, lng: 75.14083, id: 'CLST_202604_N20_14499', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.51556, lng: 72.2416, id: 'CLST_202604_N20_18591', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.7137, lng: 76.61013, id: 'CLST_202604_N20_15246', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' }
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
