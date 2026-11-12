/* Tema elegido antes (día/noche): se aplica antes de pintar para que no haya fogonazo */
try { var t = localStorage.getItem('tema'); if (t === 'dia' || t === 'noche') document.documentElement.dataset.tema = t; } catch (e) {}
