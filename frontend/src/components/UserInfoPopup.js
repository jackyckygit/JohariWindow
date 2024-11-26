import React, { useState } from 'react';

const UserInfoPopup = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()!='' /*&& email.trim()!=''*/ && group.trim()!='') {
      onSubmit({ name, email, group });
    }
  };

  return (
    <div className="user-info-popup">
      <form onSubmit={handleSubmit}>
        <h2>您好，請輸入以下資料</h2>
        <input
          type="text"
          value={name}
          name="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="名稱"
        />
        <input
          type="text"
          value={group}
          name="group"
          onChange={(e) => setGroup(e.target.value)}
          placeholder="組名"
        />
        <button type="submit" disabled={name.trim()=='' /*|| email.trim()==''*/ || group.trim()==''}>
          Start
        </button>
      </form>
    </div>
  );
};

export default UserInfoPopup;