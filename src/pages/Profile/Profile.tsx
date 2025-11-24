import React from 'react'
import { PageHeader, UserProfile } from '../../components/molecules'
import { useTheme } from '../../context/Theme/ThemeContext'

const Profile:React.FC = () => {
  const {colors} = useTheme();
  return (
    <div style={{color:colors.grey[100]}}>
      <div className='flex items-center justify-start gap-10'>
        <PageHeader 
          title='PROFILE VIEW'
          subTitle=''
        />
      </div>
      <div>
        <UserProfile />
      </div>
    </div>
  )
}

export default Profile