// Native Custom Particle System
window.addEventListener('load', () => {
    console.log("Native particle engine loaded!");
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // Neon colors matching your theme
    const colors = ['#00f3ff', '#ff00ea', '#ffb800'];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.5; // speed
            this.vy = (Math.random() - 0.5) * 1.5;
            this.radius = Math.random() * 2 + 1.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for lines
        }
    }

    // Create particles (adjust number for density)
    const particleCount = window.innerWidth < 768 ? 40 : 80;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw lines between close particles
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 243, 255, ${1 - distance / 120})`;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
