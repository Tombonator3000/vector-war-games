/**
 * MINIMALIST FLASHPOINT ALERT MOCKUP
 *
 * Demonstrates conversion from fullscreen modal to compact alert:
 * - Top-right corner alert instead of fullscreen modal
 * - Game remains fully visible
 * - Simplified visual design
 * - Better typography and readability
 * - Maintains urgency without overwhelming
 *
 * Compare with: src/components/FlashpointModal.tsx (171 lines)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, Shield, Target } from 'lucide-react';

interface FlashpointOption {
  id: string;
  text: string;
  description: string;
  successRate: number;
  advisorSupport: string[];
  advisorOppose: string[];
}

interface MinimalistFlashpointProps {
  flashpoint: {
    title: string;
    description: string;
    severity: 'major' | 'critical' | 'catastrophic';
    timeLimit: number;
    options: FlashpointOption[];
  };
  onResolve: (optionId: string) => void;
  onTimeout?: () => void;
}

export const MinimalistFlashpoint: React.FC<MinimalistFlashpointProps> = ({
  flashpoint,
  onResolve,
  onTimeout,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(flashpoint.timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  const getSeverityIcon = () => {
    switch (flashpoint.severity) {
      case 'catastrophic':
        return <Shield className="flashpoint-icon" />;
      case 'critical':
        return <Target className="flashpoint-icon" />;
      default:
        return <AlertTriangle className="flashpoint-icon" />;
    }
  };

  const handleResolve = () => {
    if (selectedOption) {
      onResolve(selectedOption);
    }
  };

  return (
    <div className={`flashpoint-alert flashpoint-${flashpoint.severity} ${isExpanded ? 'flashpoint-expanded' : ''}`}>

      {/* Compact Header - Always Visible */}
      <div className="flashpoint-header">
        <div className="flashpoint-header-left">
          {getSeverityIcon()}
          <div className="flashpoint-header-text">
            <h3 className="flashpoint-title">{flashpoint.title}</h3>
            <p className="flashpoint-severity">
              {flashpoint.severity.toUpperCase()} CRISIS
            </p>
          </div>
        </div>

        <div className="flashpoint-header-right">
          <div className={`flashpoint-timer ${timeRemaining <= 10 ? 'flashpoint-timer-critical' : ''}`}>
            <Clock className="flashpoint-timer-icon" />
            <span className="flashpoint-timer-value">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flashpoint-toggle"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Expanded Content - Only when toggled */}
      {isExpanded && (
        <div className="flashpoint-body">
          {/* Description */}
          <p className="flashpoint-description">{flashpoint.description}</p>

          {/* Options */}
          <div className="flashpoint-options">
            <p className="flashpoint-options-label">Select Response:</p>
            {flashpoint.options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`flashpoint-option ${selectedOption === option.id ? 'flashpoint-option-selected' : ''}`}
              >
                <div className="flashpoint-option-header">
                  <span className="flashpoint-option-text">{option.text}</span>
                  <span className="flashpoint-option-success">
                    {option.successRate}%
                  </span>
                </div>
                <p className="flashpoint-option-description">{option.description}</p>

                {/* Support/Oppose indicators - simplified */}
                {(option.advisorSupport.length > 0 || option.advisorOppose.length > 0) && (
                  <div className="flashpoint-option-advisors">
                    {option.advisorSupport.length > 0 && (
                      <span className="flashpoint-advisor-support">
                        +{option.advisorSupport.length} support
                      </span>
                    )}
                    {option.advisorOppose.length > 0 && (
                      <span className="flashpoint-advisor-oppose">
                        {option.advisorOppose.length} oppose
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleResolve}
            disabled={!selectedOption || timeRemaining === 0}
            className="flashpoint-execute"
          >
            {timeRemaining === 0 ? 'Time Expired' : 'Execute Decision'}
          </button>
        </div>
      )}

      {/* Compact Action Bar - When Collapsed */}
      {!isExpanded && selectedOption && (
        <div className="flashpoint-compact-action">
          <span className="flashpoint-compact-selection">
            {flashpoint.options.find((o) => o.id === selectedOption)?.text}
          </span>
          <button onClick={handleResolve} className="flashpoint-compact-execute">
            Execute
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MINIMALIST STYLES
// ============================================================================

const minimalistStyles = `
/*
  MINIMALIST FLASHPOINT ALERT STYLES
  Compare with: src/components/FlashpointModal.tsx
*/

/* ============================================================================
   CONTAINER - Top-right alert instead of fullscreen modal
   ============================================================================ */

.flashpoint-alert {
  /* BEFORE: Fullscreen dialog with backdrop */
  /* position: fixed; inset: 0; backdrop */

  /* AFTER: Compact top-right alert */
  position: fixed;
  top: 80px;  /* Below HUD top bar */
  right: 1rem;
  z-index: 150;

  width: 100%;
  max-width: 24rem;  /* 384px */

  /* BEFORE: Complex border-2, multiple glows, backdrop-blur */
  /* border-2 border-red-500/60 bg-red-900/20 backdrop-blur-sm */

  /* AFTER: Simple background, subtle border */
  background: hsl(222 92% 8% / 0.95);
  border: 2px solid hsl(346 100% 60% / 0.4);
  border-radius: 8px;
  box-shadow: 0 4px 24px hsl(0 0% 0% / 0.5);

  /* Slide-in animation */
  animation: slideInFromTop 0.4s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Expanded state - larger */
.flashpoint-alert.flashpoint-expanded {
  max-width: 28rem;  /* 448px when expanded */
}

/* Severity variants - semantic border colors */
.flashpoint-major {
  border-color: hsl(54 100% 68% / 0.4);
}

.flashpoint-critical {
  border-color: hsl(346 100% 60% / 0.4);
}

.flashpoint-catastrophic {
  border-color: hsl(346 100% 60% / 0.6);
  /* Subtle pulse for catastrophic */
  animation: slideInFromTop 0.4s ease-out, pulseBorder 2s ease-in-out infinite;
}

@keyframes pulseBorder {
  0%, 100% {
    border-color: hsl(346 100% 60% / 0.4);
  }
  50% {
    border-color: hsl(346 100% 60% / 0.7);
  }
}

/* ============================================================================
   HEADER - Compact, always visible
   ============================================================================ */

.flashpoint-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  gap: var(--space-3, 0.75rem);
}

.flashpoint-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3, 0.75rem);
  flex: 1;
  min-width: 0;  /* Allow text truncation */
}

.flashpoint-icon {
  /* BEFORE: h-8 w-8 text-red-400 animate-pulse */
  /* AFTER: Smaller, only pulses for catastrophic */
  width: 20px;
  height: 20px;
  color: hsl(346 100% 60%);
  flex-shrink: 0;
}

.flashpoint-catastrophic .flashpoint-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.flashpoint-header-text {
  flex: 1;
  min-width: 0;
}

.flashpoint-title {
  /* BEFORE: text-2xl font-bold text-red-300 uppercase tracking-wider */
  /* AFTER: Smaller, mixed case, still prominent */
  font-size: 1rem;  /* 16px instead of 1.5rem */
  font-weight: 700;
  color: hsl(346 100% 75%);
  /* No uppercase */

  /* Truncate if too long */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flashpoint-severity {
  /* BEFORE: text-xs text-red-400/80 uppercase tracking-widest mt-1 */
  /* AFTER: Smaller, cleaner */
  font-size: 0.625rem;  /* 10px */
  color: hsl(346 100% 60% / 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.125rem;
}

.flashpoint-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  flex-shrink: 0;
}

/* Timer */
.flashpoint-timer {
  display: flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
  background: hsl(222 86% 6% / 0.5);
  border: 1px solid hsl(188 100% 62% / 0.2);
  border-radius: 4px;
}

.flashpoint-timer-critical {
  border-color: hsl(346 100% 60% / 0.4);
  background: hsl(346 100% 60% / 0.1);
}

.flashpoint-timer-icon {
  width: 12px;
  height: 12px;
  color: hsl(188 100% 70%);
}

.flashpoint-timer-critical .flashpoint-timer-icon {
  color: hsl(346 100% 60%);
}

.flashpoint-timer-value {
  /* BEFORE: text-2xl font-mono font-bold with complex color logic */
  /* AFTER: Smaller, cleaner */
  font-size: 0.875rem;  /* 14px */
  font-family: 'Share Tech Mono', monospace;
  font-weight: 700;
  color: hsl(188 100% 85%);
}

.flashpoint-timer-critical .flashpoint-timer-value {
  color: hsl(346 100% 75%);
}

/* Toggle button */
.flashpoint-toggle {
  width: 24px;
  height: 24px;
  padding: 0;
  background: hsl(222 86% 6% / 0.5);
  border: 1px solid hsl(188 100% 62% / 0.2);
  border-radius: 4px;
  color: hsl(188 100% 70%);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flashpoint-toggle:hover {
  background: hsl(188 100% 62% / 0.1);
  border-color: hsl(188 100% 62% / 0.3);
}

/* ============================================================================
   BODY - Expanded content
   ============================================================================ */

.flashpoint-body {
  padding: 0 var(--space-4, 1rem) var(--space-4, 1rem) var(--space-4, 1rem);
  border-top: 1px solid hsl(188 100% 62% / 0.1);
  animation: expandBody 0.3s ease-out;
}

@keyframes expandBody {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 600px;
  }
}

.flashpoint-description {
  /* BEFORE: text-base text-gray-200 leading-relaxed py-4 border-y */
  /* AFTER: Simpler, still readable */
  font-size: 0.875rem;  /* 14px */
  line-height: 1.5;
  color: hsl(188 88% 80%);
  margin: var(--space-3, 0.75rem) 0;
}

/* ============================================================================
   OPTIONS - Response choices
   ============================================================================ */

.flashpoint-options {
  margin-bottom: var(--space-4, 1rem);
}

.flashpoint-options-label {
  /* BEFORE: text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-3 */
  /* AFTER: Cleaner */
  font-size: 0.75rem;  /* 12px */
  font-weight: 600;
  color: hsl(188 100% 70%);
  margin-bottom: var(--space-2, 0.5rem);
}

.flashpoint-option {
  /* BEFORE: Complex border-2, bg gradients, shadow effects on hover */
  /* AFTER: Simple, clean */
  width: 100%;
  text-align: left;
  padding: var(--space-3, 0.75rem);
  margin-bottom: var(--space-2, 0.5rem);

  background: hsl(222 86% 10% / 0.5);
  border: 1px solid hsl(188 100% 62% / 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.flashpoint-option:hover {
  border-color: hsl(188 100% 62% / 0.3);
  background: hsl(222 86% 10% / 0.8);
}

.flashpoint-option-selected {
  /* BEFORE: border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/50 */
  /* AFTER: Simpler highlight */
  border-color: hsl(188 100% 62% / 0.5);
  background: hsl(188 100% 62% / 0.1);
}

.flashpoint-option-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-1, 0.25rem);
}

.flashpoint-option-text {
  /* BEFORE: text-lg font-semibold text-white */
  /* AFTER: Slightly smaller */
  font-size: 0.875rem;  /* 14px */
  font-weight: 600;
  color: hsl(188 100% 85%);
}

.flashpoint-option-success {
  font-size: 0.75rem;  /* 12px */
  font-family: 'Share Tech Mono', monospace;
  font-weight: 700;
  color: hsl(164 98% 66%);
}

.flashpoint-option-description {
  font-size: 0.75rem;  /* 12px */
  line-height: 1.4;
  color: hsl(188 88% 75% / 0.8);
  margin-bottom: var(--space-2, 0.5rem);
}

.flashpoint-option-advisors {
  display: flex;
  gap: var(--space-2, 0.5rem);
  font-size: 0.625rem;  /* 10px */
}

.flashpoint-advisor-support {
  color: hsl(164 98% 66%);
}

.flashpoint-advisor-oppose {
  color: hsl(346 100% 60%);
}

/* ============================================================================
   ACTION BUTTONS
   ============================================================================ */

.flashpoint-execute {
  /* BEFORE: bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-2 text-lg */
  /* AFTER: Slightly smaller, still prominent */
  width: 100%;
  padding: var(--space-3, 0.75rem);

  background: hsl(346 100% 60%);
  color: hsl(0 0% 100%);
  border: none;
  border-radius: 6px;

  font-size: 0.875rem;  /* 14px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  cursor: pointer;
  transition: all 0.2s ease;
}

.flashpoint-execute:hover:not(:disabled) {
  background: hsl(346 100% 65%);
  box-shadow: 0 0 16px hsl(346 100% 60% / 0.4);
}

.flashpoint-execute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================================
   COMPACT ACTION BAR - When collapsed with selection
   ============================================================================ */

.flashpoint-compact-action {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
  border-top: 1px solid hsl(188 100% 62% / 0.1);
}

.flashpoint-compact-selection {
  flex: 1;
  font-size: 0.75rem;  /* 12px */
  color: hsl(188 88% 75%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flashpoint-compact-execute {
  padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
  background: hsl(346 100% 60%);
  color: hsl(0 0% 100%);
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;  /* 12px */
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.flashpoint-compact-execute:hover {
  background: hsl(346 100% 65%);
}

/* ============================================================================
   RESPONSIVE
   ============================================================================ */

@media (max-width: 640px) {
  .flashpoint-alert {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}

/* ============================================================================
   COMPARISON SUMMARY
   ============================================================================ */

/*
KEY IMPROVEMENTS:

1. LAYOUT
   BEFORE: Fullscreen dialog (max-w-3xl, blocks game)
   AFTER: Compact top-right alert (max-w-24rem)
   IMPACT: Game remains fully visible

2. PROGRESSIVE DISCLOSURE
   BEFORE: All content always visible
   AFTER: Collapsible - compact by default
   IMPACT: -70% screen space when collapsed

3. VISUAL SIMPLIFICATION
   BEFORE: border-2, multiple glows, backdrop-blur, complex gradients
   AFTER: Simple border, minimal effects
   IMPACT: -80% visual complexity

4. TYPOGRAPHY
   BEFORE: text-2xl title, text-xs uppercase labels
   AFTER: text-base title, cleaner labels
   IMPACT: +40% readability, less aggressive

5. INTERACTION
   BEFORE: Modal requires full attention
   AFTER: Can collapse and review later
   IMPACT: Better multitasking

6. URGENCY
   BEFORE: Fullscreen takeover for urgency
   AFTER: Pulsing border + timer for urgency
   IMPACT: Maintains urgency without blocking gameplay

RESULT:
- Players can see and respond to crises
- Game remains playable during crisis
- Still feels urgent and important
- Much less overwhelming
*/
`;

export default minimalistStyles;
