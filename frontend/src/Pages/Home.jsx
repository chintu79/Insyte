import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <div className={`hero-content ${isLoaded ? 'loaded' : ''}`}>
          <div className="hero-badge">
            <span>✨ AI-Powered Data Analytics</span>
          </div>

          <h1 className="hero-title">
            Transform Your Data Into
            <span className="gradient-text"> Actionable Insights</span>
          </h1>

          <p className="hero-subtitle">
            Upload your dataset and let AI unlock hidden patterns, generate 
            intelligent features, and predict the future with advanced machine learning models.
          </p>

          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span>Automated EDA</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚙️</span>
              <span>Auto ML Models</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <span>AI Insights</span>
            </div>
          </div>

          <div className="hero-buttons">
            <Link to="/upload" className="btn btn-primary">
              <span>🚀</span> Get Started Now
            </Link>
            <button className="btn btn-secondary">
              <span>📚</span> Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Datasets Analyzed</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">ML Models</div>
            </div>
          </div>
        </div>

        {/* Floating Card */}
        <div className="floating-card">
          <div className="card-header">Processing Dataset...</div>
          <div className="card-content">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Auto Feature Engineering</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need for complete data analysis</p>
        </div>

        <div className="features-grid">
          <FeatureCard
            icon="📊"
            title="Automated EDA"
            description="Get instant exploratory data analysis with beautiful visualizations"
          />
          <FeatureCard
            icon="🤖"
            title="AutoML Engine"
            description="Train multiple models automatically and select the best one"
          />
          <FeatureCard
            icon="✨"
            title="Feature Engineering"
            description="Intelligent feature creation and selection powered by AI"
          />
          <FeatureCard
            icon="📈"
            title="Predictions"
            description="Get accurate predictions with confidence intervals"
          />
          <FeatureCard
            icon="💬"
            title="AI Chat"
            description="Ask questions about your data using natural language"
          />
          <FeatureCard
            icon="📥"
            title="Easy Upload"
            description="Support for CSV, Excel, and other tabular data formats"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>3 simple steps to data insights</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Upload Dataset</h3>
            <p>Simply drag and drop your CSV or Excel file</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h3>AI Analysis</h3>
            <p>Automatic EDA, feature engineering & model training</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Get Insights</h3>
            <p>Interactive report with predictions and recommendations</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Unlock Your Data's Potential?</h2>
          <p>Start analyzing your data with AI in seconds</p>
          <Link to="/upload" className="btn btn-primary btn-large">
            Upload Your Dataset Now
          </Link>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="card-border"></div>
    </div>
  );
}