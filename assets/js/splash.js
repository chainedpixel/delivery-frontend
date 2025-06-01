
(function() {
    'use strict';

    
    const splashStyles = `
        #blazeSplash {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background:linear-gradient(135deg, var(--ucla-blue) 0%, var(--prussian-navy) 100%)
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
        }

        #blazeSplash.fade-out {
            opacity: 0;
            visibility: hidden;
        }

        .splash-logo {
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            animation: pulseGlow 2s ease-in-out infinite;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .splash-logo i {
            font-size: 48px;
            color: white;
        }

        .splash-title {
            color: white;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
            text-align: center;
        }

        .splash-subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 16px;
            font-weight: 400;
            text-align: center;
            margin-bottom: 40px;
            max-width: 300px;
            line-height: 1.5;
        }

        .splash-loader {
            width: 50px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }

        .splash-loader::after {
            content: '';
            position: absolute;
            top: 0;
            left: -50px;
            width: 50px;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            animation: loading 1.5s ease-in-out infinite;
        }

        @keyframes pulseGlow {
            0%, 100% {
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
                transform: scale(1.05);
            }
        }

        @keyframes loading {
            0% {
                left: -50px;
            }
            100% {
                left: 100%;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .splash-logo {
                width: 100px;
                height: 100px;
                margin-bottom: 25px;
            }
            
            .splash-logo i {
                font-size: 40px;
            }
            
            .splash-title {
                font-size: 28px;
            }
            
            .splash-subtitle {
                font-size: 14px;
                max-width: 280px;
            }
        }
    `;

    
    function createSplash() {
        const splasherDiv = document.getElementById('splasher');
        
        if (!splasherDiv) {
            console.warn('Div "splasher" no encontrado en el DOM');
            return null;
        }

        
        const style = document.createElement('style');
        style.textContent = splashStyles;
        document.head.appendChild(style);

        
        splasherDiv.id = 'blazeSplash';
        splasherDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background:linear-gradient(135deg, var(--ucla-blue) 0%, var(--prussian-navy) 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
        `;

        
        const splashHTML = `
            <div class="splash-logo">
                <i class="fas fa-shipping-fast"></i>
            </div>
            <h1 class="splash-title">Blaze</h1>
            <p class="splash-subtitle">
                Gestiona y rastrea tus envíos de manera eficiente
            </p>
            <div class="splash-loader"></div>
        `;

        splasherDiv.innerHTML = splashHTML;
        
        return splasherDiv;
    }

    
    function hideSplash(splashElement, callback) {
        if (!splashElement) return;
        
        splashElement.classList.add('fade-out');
        
        setTimeout(() => {
            
            splashElement.style.display = 'none';
            splashElement.innerHTML = '';
            splashElement.id = 'splasher'; 
            
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 300);
    }

    
    function initSplash(options = {}) {
        const config = {
            minDuration: 500, 
            maxDuration: 1000, 
            autoHide: true,    
            onComplete: null,  
            ...options
        };

        const startTime = Date.now();
        let splashElement;

        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                splashElement = createSplash();
            });
        } else {
            splashElement = createSplash();
        }

        
        if (config.autoHide) {
            const handlePageLoad = () => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, config.minDuration - elapsedTime);
                
                setTimeout(() => {
                    if (splashElement) {
                        hideSplash(splashElement, config.onComplete);
                    }
                }, remainingTime);
            };

            if (document.readyState === 'complete') {
                handlePageLoad();
            } else {
                window.addEventListener('load', handlePageLoad);
            }

            
            setTimeout(() => {
                if (splashElement) {
                    hideSplash(splashElement, config.onComplete);
                }
            }, config.maxDuration);
        }

        
        return {
            hide: () => {
                if (splashElement) {
                    hideSplash(splashElement, config.onComplete);
                }
            },
            show: () => {
                const splasherDiv = document.getElementById('splasher');
                if (splasherDiv && !splasherDiv.classList.contains('splash-active')) {
                    splashElement = createSplash();
                }
            }
        };
    }

    
    window.BlazeSplash = {
        init: initSplash,
        create: createSplash,
        hide: (element, callback) => hideSplash(element, callback)
    };

    
    if (!window.BLAZE_SPLASH_NO_AUTO_INIT) {
        document.addEventListener('DOMContentLoaded', () => {
            window.BlazeSplash.init();
        });
    }

})();