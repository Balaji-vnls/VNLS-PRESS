const ArticleCardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg border border-border/20 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-muted shimmer" />
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Category Badge */}
        <div className="w-20 h-5 bg-muted rounded-full shimmer" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-muted rounded shimmer" />
          <div className="w-3/4 h-5 bg-muted rounded shimmer" />
        </div>
        
        {/* Summary */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-muted rounded shimmer" />
          <div className="w-full h-4 bg-muted rounded shimmer" />
          <div className="w-2/3 h-4 bg-muted rounded shimmer" />
        </div>
        
        {/* Meta Info */}
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-muted rounded shimmer" />
          <div className="w-16 h-4 bg-muted rounded shimmer" />
        </div>
        
        {/* Button */}
        <div className="w-full h-10 bg-muted rounded shimmer" />
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;