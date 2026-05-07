import localFont from  'next/font/local';
import path from 'path';

export const ranade = localFont({
    src: [
        {
            path: '../public/fonts/Ranade-Light.woff',
            weight: '200',
            style: 'normal',

        },
        {
            path: '../public/fonts/Ranade-Medium.woff',
            weight: '500',
            style: 'normal',
        },
        
        {
            path: '../public/fonts/Ranade-Bold.woff',
            weight: '700',
            style: 'normal',
        }
    ],
    display: 'swap',
    variable: '--font-ranade',
})