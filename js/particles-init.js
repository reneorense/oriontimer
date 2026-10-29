window.addEventListener('load', () => {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: ['#00f3ff', '#ff00ea', '#ffb800'] },
                shape: { type: 'circle', stroke: { width: 1, color: '#00f3ff' } },
                opacity: { value: 0.4, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1 } },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#00f3ff', opacity: 0.2, width: 1 },
                move: { enable: true, speed: 1.5, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                },
                modes: {
                    grab: { distance: 200, line_linked: { opacity: 0.4 } },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });
    }
});
