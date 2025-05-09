
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/issues');
  }, [navigate]);

  return <div>Redirecting to issues...</div>;
};

export default Index;
