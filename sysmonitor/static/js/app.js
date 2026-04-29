document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // DOM Elements
    const cpuRing = document.getElementById('cpu-ring');
    const cpuText = document.getElementById('cpu-text');
    const cpuTempText = document.getElementById('cputemp-text');
    
    const memBar = document.getElementById('mem-bar');
    const memText = document.getElementById('mem-text');
    const memUsed = document.getElementById('mem-used');
    const memTotal = document.getElementById('mem-total');
    
    const diskBar = document.getElementById('disk-bar');
    const diskText = document.getElementById('disk-text');
    
    const batteryCard = document.getElementById('battery-card');
    const batteryRing = document.getElementById('battery-ring');
    const batteryText = document.getElementById('battery-text');

    const circumference = 2 * Math.PI * 45; // 283 for r=45

    function updateRing(ringElement, textElement, percent) {
        const offset = circumference - (percent / 100) * circumference;
        ringElement.style.strokeDashoffset = offset;
        textElement.textContent = `${Math.round(percent)}%`;

        // Update Color
        ringElement.classList.remove('color-warning', 'color-danger');
        if (percent > 85) {
            ringElement.classList.add('color-danger');
        } else if (percent > 70) {
            ringElement.classList.add('color-warning');
        }
    }

    function updateBar(barElement, textElement, percent) {
        barElement.style.width = `${percent}%`;
        textElement.textContent = `${Math.round(percent)}%`;

        // Update Color
        barElement.classList.remove('color-warning', 'color-danger');
        if (percent > 85) {
            barElement.classList.add('color-danger');
        } else if (percent > 70) {
            barElement.classList.add('color-warning');
        }
    }

    socket.on('system_update', (data) => {
        // CPU
        updateRing(cpuRing, cpuText, data.cpu);
        
        // CPU Temperature
        cpuTempText.textContent = data.cpu_temp !== undefined ? data.cpu_temp : "지원안함";
        
        // Memory
        updateBar(memBar, memText, data.memory_percent);
        memUsed.textContent = data.memory_used_gb;
        memTotal.textContent = data.memory_total_gb;
        
        // Disk
        updateBar(diskBar, diskText, data.disk_percent);

        // Battery (if available)
        if (data.battery_percent !== null && data.battery_percent !== undefined) {
            batteryCard.style.display = 'block';
            updateRing(batteryRing, batteryText, data.battery_percent);
        }
    });

    socket.on('connect_error', () => {
        console.error('Connection to server lost.');
        const status = document.querySelector('.status-indicator');
        status.innerHTML = `<span class="dot" style="background-color: var(--accent-red); animation: none;"></span> 서버 연결 끊김`;
        status.style.color = 'var(--accent-red)';
    });

    socket.on('connect', () => {
        const status = document.querySelector('.status-indicator');
        status.innerHTML = `<span class="dot pulse"></span> 실시간 연동 중`;
        status.style.color = 'var(--accent-green)';
    });
});
