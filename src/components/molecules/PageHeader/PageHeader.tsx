import React from 'react';
import { useTheme } from '../../../context/Theme/ThemeContext';

interface PageHeaderProps {
    title: string;
    subTitle: string;
}

const PageHeader:React.FC<PageHeaderProps> = ({ title , subTitle}) => {
    const {colors} = useTheme()
  return (
    <div>
        <span 
            className='text-lg font-bold lg:text-xl'
            style={{color:colors.grey[100]}}>{title}</span>
        <p className='lg:text-sm text-[12px]' style={{color:colors.greenAccent[400]}}>{subTitle}</p>
    </div>
  )
}

export default PageHeader