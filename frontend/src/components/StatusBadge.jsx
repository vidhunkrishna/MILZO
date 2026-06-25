import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase().replace(/_/g, ' ');

  let badgeClass = 'badge-neutral';
  
  if (['active', 'completed', 'delivered', 'paid', 'verified', 'success', 'approved', 'yes'].includes(normalized)) {
    badgeClass = 'badge-success';
  } else if (['pending', 'in progress', 'in_progress', 'unpaid', 'on hold', 'pending kyc', 'pending_kyc', 'processing'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['inactive', 'cancelled', 'canceled', 'suspended', 'failed', 'rejected', 'blocked', 'no'].includes(normalized)) {
    badgeClass = 'badge-danger';
  } else if (['shipped', 'subscribed', 'scheduled', 'leave', 'assigned'].includes(normalized)) {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`${badgeClass} capitalize px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75"></span>
      {normalized}
    </span>
  );
};

export default StatusBadge;
