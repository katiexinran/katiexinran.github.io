import * as React from 'react';
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  const [position, setPosition] = React.useState<ToasterProps['position']>('top-right');

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia('(max-width: 640px)');
    const updatePosition = () => {
      setPosition(query.matches ? 'top-center' : 'top-right');
    };

    updatePosition();
    query.addEventListener('change', updatePosition);
    return () => query.removeEventListener('change', updatePosition);
  }, []);

  return (
    <SonnerToaster
      closeButton={false}
      theme="light"
      {...props}
      position={props.position ?? position}
      toastOptions={{
        classNames: {
          toast: 'bg-white text-black border border-gray-200',
          title: 'text-black font-semibold',
          description: 'text-gray-600',
          actionButton: 'bg-black text-white hover:bg-gray-800',
          cancelButton: 'bg-gray-100 text-black hover:bg-gray-200',
        },
      }}
    />
  );
}
