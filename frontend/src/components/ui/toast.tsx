'use client';

import { toast as toastify } from 'react-toastify';

export const toast = {
  success: (message: string) => {
    toastify.success(message);
  },
  error: (message: string) => {
    toastify.error(message);
  },
  warning: (message: string) => {
    toastify.warning(message);
  },
  info: (message: string) => {
    toastify.info(message);
  }
};

export default toast; 