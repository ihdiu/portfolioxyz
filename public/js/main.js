// Portfolio Client Application Entry Point
import { initTheme } from './theme.js';
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';
import { initTyping } from './typing.js';
import { initFilters } from './filters.js';
import { initModal } from './modal.js';
import { initCareerTree } from './careerTree.js?v=3';
import { initCircuit } from './circuit.js';
import { initContact } from './contact.js';
import { initScenery } from './scenery.js';

function bootstrap() {
  initScenery();
  initTheme();
  initReveal();
  initNav();
  initTyping();
  initFilters();
  initModal();
  initCareerTree();
  initCircuit();
  initContact();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
