import { createFileRoute } from '@tanstack/react-router';

import { HomePage } from './index';

export const Route = createFileRoute('/home')({component: HomePage,});
