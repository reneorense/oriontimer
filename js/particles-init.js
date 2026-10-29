window.addEventListener('load', () => {
    console.log("Particles script loaded!");
    
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ['#00f3ff', '#ff00ea', '#ffb800'] },
                shape: { type: 'circle' },
                opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.2 } },
                size: { value: 4, random: true }, /* Made particles slightly bigger */
                line_linked: { enable: true, distance: 150, color: '#00f3ff', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2.5, direction: 'none', random: true, straight: false, out_mode: 'out' } /* Made them move faster */
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                },
                modes: {
                    grab: { distance: 200, line_linked: { opacity: 0.6 } },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });
        console.log("Particles initialized successfully!");
    } else {
        console.error("Particles library failed to load. Check internet connection.");
    }
});
