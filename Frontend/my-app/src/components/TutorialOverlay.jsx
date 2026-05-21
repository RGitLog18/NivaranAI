import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const tutorialSteps = [
  {
    target: '[data-tutorial="visualization"]',
    title: 'View Complaints',
    description: 'Click here to view all complaints on an interactive map. You can select individual complaints to see their details.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="officers"]',
    title: 'Desk Officers',
    description: 'Manage and view all officers working under you. You can allocate complaints and send reports to them.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="statistics"]',
    title: 'Statistics',
    description: 'View detailed statistics about complaints including daily, weekly, and yearly data.',
    position: 'bottom'
  },
  {
    target: '[data-tutorial="email"]',
    title: 'Send Email',
    description: 'Quickly send emails and communications to citizens or officers regarding complaints.',
    position: 'bottom'
  }
];

export function TutorialOverlay() {
  const { showTutorial, setShowTutorial } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (showTutorial && tutorialSteps[currentStep]) {
      const target = document.querySelector(tutorialSteps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      }
    }
  }, [showTutorial, currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorialCompleted', 'true');
  };

  if (!showTutorial || !targetRect) return null;

  const step = tutorialSteps[currentStep];
  
  const getTooltipPosition = () => {
    const offset = 20;
    switch (step.position) {
      case 'bottom':
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'top':
        return {
          top: targetRect.top - offset,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - offset,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + offset,
          transform: 'translateY(-50%)'
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Overlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 pointer-events-auto"
          onClick={handleSkip}
        />

        {/* Spotlight */}
        <div
          className="absolute border-4 border-primary rounded-lg pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bg-card text-card-foreground rounded-lg shadow-2xl p-6 max-w-sm pointer-events-auto border-2 border-primary"
          style={getTooltipPosition()}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-primary">{step.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6 -mt-1 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep < tutorialSteps.length - 1 ? (
                  <>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  'Got it!'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}