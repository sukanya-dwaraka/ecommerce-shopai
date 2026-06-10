import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-52 w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-6 w-24 mt-1" />
        <div className="skeleton h-9 w-full rounded-md mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-24" />
      </div>
      <div className="skeleton h-16 w-full" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  );
}
