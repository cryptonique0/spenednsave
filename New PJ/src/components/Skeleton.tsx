'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';
  const animationStyles = animate ? 'animate-pulse' : '';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles} ${className}`}
      style={style}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

interface SkeletonProfileProps {
  className?: string;
}

export function SkeletonProfile({ className = '' }: SkeletonProfileProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-start space-x-6 mb-6">
        <Skeleton variant="circular" width={100} height={100} />
        <div className="flex-1">
          <Skeleton variant="text" width="40%" height={32} className="mb-2" />
          <Skeleton variant="text" width="60%" className="mb-4" />
          <div className="flex gap-2">
            <Skeleton width={80} height={32} />
            <Skeleton width={80} height={32} />
            <Skeleton width={80} height={32} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div>
          <Skeleton variant="text" width="30%" height={24} className="mb-3" />
          <SkeletonText lines={4} />
        </div>
        <div>
          <Skeleton variant="text" width="30%" height={24} className="mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
