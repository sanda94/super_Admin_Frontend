import React, { useState } from 'react';
import { PageHeader } from '../../components/molecules';
import { useTheme } from '../../context/Theme/ThemeContext';

const EditProfile: React.FC = () => {
    const {theme} = useTheme()
  const [userData, setUserData] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    address: '',
    organization: '',
    userImage: null as File | null,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Handlers for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  // Handler for image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUserData({ ...userData, userImage: e.target.files[0] });
    }
  };

  // Clear form data
  const handleClearForm = () => {
    setUserData({
      fullName: '',
      emailAddress: '',
      phoneNumber: '',
      address: '',
      organization: '',
      userImage: null,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Validation and save changes
  const handleSaveChanges = () => {
    if (userData.newPassword && (userData.newPassword !== userData.confirmPassword)) {
      alert("New password and confirm password do not match!");
      return;
    }

    // Submit data logic goes here...
    alert('Changes saved successfully!');
  };

  return (
    <div className="container p-6 mx-auto">
      {/* Page header */}
      <PageHeader title="EDIT PROFILE" subTitle="This is The Edit Profile Details Page." />

      <div className={`p-6 space-y-8 mt-5 rounded-lg shadow-lg ${theme === 'dark' ? "bg-white" : "bg-gray-200"}`}>
        {/* Personal Details Section */}
        <div>
          <h3 className="pb-2 mb-4 text-lg font-semibold text-gray-800 border-b">Personal Details</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Email Address</label>
              <input
                type="email"
                name="emailAddress"
                value={userData.emailAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Address</label>
              <textarea
                name="address"
                value={userData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Organization</label>
              <input
                type="text"
                name="organization"
                value={userData.organization}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">User Image</label>
              <input
                type="file"
                name="userImage"
                onChange={handleImageChange}
                className="w-full px-3 py-2 text-[12px] mt-1 bg-white border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* Authentication Details Section */}
        <div>
          <h3 className="pb-2 mb-4 text-lg font-semibold text-gray-800 border-b">Authentication Details</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={userData.oldPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={userData.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 border text-[12px] rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 mt-1 text-[12px] border rounded-lg focus:ring focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* Buttons: Clear, Cancel, Save Changes */}
        <div className="flex flex-col justify-end gap-5 mt-6 lg:space-x-4 lg:flex-row">
          <button
            className="px-4 py-2 font-semibold text-[12px] w-full text-black bg-gray-300 rounded-md hover:bg-gray-200"
            onClick={handleClearForm}
          >
            Clear
          </button>
          <button
            className="px-4 py-2 font-semibold text-[12px] w-full text-white bg-blue-400 rounded-md hover:bg-blue-300"
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
