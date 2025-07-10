import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, FileText } from "lucide-react";

interface QuestionnaireData {
  whatWeDo: string;
  tonality: string;
  strategyPillars: string;
  contentIPs: string;
  whatNotToDo: string;
  audienceDemographics: string;
  aspirationMarket: string;
  brandValues: string;
  uniqueSellingProposition: string;
  competitiveAdvantage: string;
}

interface BrandbookQuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isGenerating: boolean;
}

const questions = [
  {
    key: 'whatWeDo' as keyof QuestionnaireData,
    title: 'What We Do',
    description: 'Describe your company, products, or services in detail',
    placeholder: 'We are a technology company that provides...',
    type: 'textarea'
  },
  {
    key: 'tonality' as keyof QuestionnaireData,
    title: 'Brand Tonality',
    description: 'How should your brand sound? (e.g., professional, friendly, innovative, playful)',
    placeholder: 'Professional yet approachable, innovative, trustworthy...',
    type: 'textarea'
  },
  {
    key: 'strategyPillars' as keyof QuestionnaireData,
    title: 'Strategy Pillars',
    description: 'What are the core strategic pillars that guide your brand?',
    placeholder: 'Innovation, Customer-centricity, Quality, Sustainability...',
    type: 'textarea'
  },
  {
    key: 'contentIPs' as keyof QuestionnaireData,
    title: 'Content IPs',
    description: 'What unique content formats, series, or intellectual properties does your brand own?',
    placeholder: 'Weekly industry insights, Behind-the-scenes series, Expert interviews...',
    type: 'textarea'
  },
  {
    key: 'whatNotToDo' as keyof QuestionnaireData,
    title: 'What Not To Do',
    description: 'What should your brand absolutely avoid in terms of messaging, tone, or content?',
    placeholder: 'Avoid controversial topics, overly promotional content, unprofessional language...',
    type: 'textarea'
  },
  {
    key: 'audienceDemographics' as keyof QuestionnaireData,
    title: 'Audience Demographics',
    description: 'Describe your target audience in detail (age, profession, interests, pain points)',
    placeholder: 'Young professionals aged 25-35, tech-savvy, career-focused...',
    type: 'textarea'
  },
  {
    key: 'aspirationMarket' as keyof QuestionnaireData,
    title: 'Aspiration Market',
    description: 'What market segment or audience do you aspire to reach in the future?',
    placeholder: 'Enterprise clients, international markets, younger demographics...',
    type: 'textarea'
  },
  {
    key: 'brandValues' as keyof QuestionnaireData,
    title: 'Brand Values',
    description: 'What core values does your brand stand for?',
    placeholder: 'Integrity, Innovation, Inclusivity, Excellence...',
    type: 'input'
  },
  {
    key: 'uniqueSellingProposition' as keyof QuestionnaireData,
    title: 'Unique Selling Proposition',
    description: 'What makes your brand unique in the market?',
    placeholder: 'The only platform that combines AI with human expertise...',
    type: 'textarea'
  },
  {
    key: 'competitiveAdvantage' as keyof QuestionnaireData,
    title: 'Competitive Advantage',
    description: 'What gives you an edge over your competitors?',
    placeholder: 'Superior technology, better customer service, lower costs...',
    type: 'textarea'
  }
];

export const BrandbookQuestionnaire: React.FC<BrandbookQuestionnaireProps> = ({
  onSubmit,
  isGenerating
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>({
    whatWeDo: '',
    tonality: '',
    strategyPillars: '',
    contentIPs: '',
    whatNotToDo: '',
    audienceDemographics: '',
    aspirationMarket: '',
    brandValues: '',
    uniqueSellingProposition: '',
    competitiveAdvantage: ''
  });

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = formData[currentQuestion.key].trim().length > 0;

  const handleInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(formData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (isGenerating) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Generating Your Brand Book</h2>
        <p className="text-muted-foreground mb-4">
          Our AI is analyzing your responses and creating a comprehensive brand book...
        </p>
        <div className="max-w-md mx-auto">
          <Progress value={85} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-foreground">Brand Book Questionnaire</h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor={currentQuestion.key} className="text-lg font-medium text-foreground">
            {currentQuestion.title}
          </Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {currentQuestion.description}
          </p>
          
          {currentQuestion.type === 'textarea' ? (
            <Textarea
              id={currentQuestion.key}
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.key]}
              onChange={(e) => handleInputChange(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isGenerating}
            />
          ) : (
            <Input
              id={currentQuestion.key}
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.key]}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isGenerating}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isGenerating}
          >
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isGenerating}
            className="flex items-center gap-2"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Generate Brand Book
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Question indicators */}
        <div className="flex justify-center space-x-2 pt-4">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};