const FeatureHighlight = () => {
  return (
    <section className="py-8 md:py-10" style={{ backgroundColor: '#C8E6C9' }}>
      {/* QA: UI/UX fix 2025-10-15 - Changed text alignment from left to center per design spec */}
      <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 md:mb-4" style={{ color: '#FF6B6B' }}>
          Advanced Fall Detection{' '}
          <span className="text-lg md:text-xl font-medium" style={{ color: '#FF0000' }}>
            Coming Soon
          </span>
        </h2>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: '#2F4733' }}>
          Parra can connect with select fall-detection devices to provide added safety. It's completely optional, designed for those who want a little extra peace of mind.
        </p>
      </div>
    </section>
  );
};

export default FeatureHighlight;
