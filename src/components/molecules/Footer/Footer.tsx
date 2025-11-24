import React from 'react';
import { useTheme } from '../../../context/Theme/ThemeContext';
import { FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import { CiAt } from "react-icons/ci";

const Footer: React.FC = () => {
    const { colors } = useTheme();

    return (
        <footer 
            className='z-0 flex flex-col items-center justify-between w-full p-5 mt-5 text-center md:flex-row'
            style={{
                color: colors.grey[100],
                backgroundColor: colors.primary[400],
                boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* Company Info */}
            <div className='flex items-center gap-2 text-[12px] lg:text-[13px] mt-2 md:mt-0'>
                <CiAt className='text-[14px] lg:text-xl font-semibold' /> {/* AT Icon */}
                <span>2025 XPAC Technologies Pte Ltd</span>
            </div>

            {/* Address with Icon */}
            <div className='flex items-center gap-2 text-[12px] lg:text-[13px] mt-2 md:mt-0'>
                <FaMapMarkerAlt className='text-[14px] lg:text-xl' /> {/* Address Icon */}
                <span>20 Gul Ln, Singapore 629415</span>
            </div>

            {/* Phone with Icon */}
            <div className='flex items-center gap-2 text-[12px] lg:text-[13px] mt-2 md:mt-0'>
                <FaPhoneAlt className='text-[14px] lg:text-xl' /> {/* Phone Icon */}
                <span>+65 6861 0111</span>
            </div>
        </footer>
    );
};

export default Footer;
