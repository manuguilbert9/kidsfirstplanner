'use client';

import { useState } from 'react';
import { WizardStep } from './wizard-step';
import { ProgressIndicator } from './progress-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParentRole } from '@/lib/types';

interface ScheduleWizardProps {
  currentUserEmail: string | null;
  onComplete: (data: {
    yourName: string;
    otherParentName: string;
    startDate: Date;
    startingParent: 'you' | 'other';
    handoverDay: number;
    handoverTime: string;
  }) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export function ScheduleWizard({ currentUserEmail, onComplete }: ScheduleWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Names
  const [yourName, setYourName] = useState('');
  const [otherParentName, setOtherParentName] = useState('');

  // Step 2: Start date and who starts
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startingParent, setStartingParent] = useState<'you' | 'other'>('you');

  // Step 3: Handover details
  const [handoverDay, setHandoverDay] = useState<number>(1); // Monday by default
  const [handoverTime, setHandoverTime] = useState('18:00');

  const steps = ['Prénoms', 'Dates', 'Passation', 'Confirmation'];

  const canGoToStep2 = yourName.trim() !== '' && otherParentName.trim() !== '';
  const canGoToStep3 = startDate !== undefined;
  const canComplete = canGoToStep2 && canGoToStep3 && handoverDay && handoverTime;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!canComplete || !startDate) return;

    setIsSubmitting(true);
    try {
      await onComplete({
        yourName: yourName.trim(),
        otherParentName: otherParentName.trim(),
        startDate,
        startingParent,
        handoverDay,
        handoverTime,
      });
    } catch (error) {
      console.error('Error completing wizard:', error);
      setIsSubmitting(false);
    }
  };

  const getPreviewText = () => {
    if (!startDate) return '';

    const dayName = DAYS_OF_WEEK.find(d => d.value === handoverDay)?.label || '';
    const starterName = startingParent === 'you' ? yourName : otherParentName;
    const otherName = startingParent === 'you' ? otherParentName : yourName;

    return `À partir du ${format(startDate, 'dd MMMM yyyy', { locale: fr })}, ${starterName} aura les enfants la première semaine. Le changement de garde se fera chaque ${dayName} à ${handoverTime}, en alternant entre ${starterName} et ${otherName}.`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <ProgressIndicator currentStep={currentStep} totalSteps={4} steps={steps} />

      {/* Step 1: Names */}
      {currentStep === 1 && (
        <WizardStep
          title="Commençons par les prénoms"
          description="Pour personnaliser votre calendrier, dites-nous comment vous appeler."
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="yourName">Votre prénom</Label>
              <Input
                id="yourName"
                placeholder="ex: Marie"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                className="mt-1.5"
                autoFocus
              />
              {currentUserEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Connecté en tant que {currentUserEmail}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="otherParentName">Prénom de l&apos;autre parent</Label>
              <Input
                id="otherParentName"
                placeholder="ex: Pierre"
                value={otherParentName}
                onChange={(e) => setOtherParentName(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleNext} disabled={!canGoToStep2}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </WizardStep>
      )}

      {/* Step 2: Start date and who starts */}
      {currentStep === 2 && (
        <WizardStep
          title="Configuration du planning"
          description="Quand commence votre planning d'alternance et qui a les enfants en premier ?"
        >
          <div className="space-y-6">
            <div>
              <Label>Date de début de l&apos;alternance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal mt-1.5',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'dd MMMM yyyy', { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Qui a les enfants la première semaine ?</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button
                  variant={startingParent === 'you' ? 'default' : 'outline'}
                  onClick={() => setStartingParent('you')}
                  className="h-auto py-4"
                >
                  <div className="text-center">
                    <div className="font-semibold">{yourName || 'Vous'}</div>
                    <div className="text-xs mt-1 opacity-80">Vous commencez</div>
                  </div>
                </Button>
                <Button
                  variant={startingParent === 'other' ? 'default' : 'outline'}
                  onClick={() => setStartingParent('other')}
                  className="h-auto py-4"
                >
                  <div className="text-center">
                    <div className="font-semibold">{otherParentName || 'L\'autre parent'}</div>
                    <div className="text-xs mt-1 opacity-80">
                      {otherParentName || 'L\'autre parent'} commence
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleNext} disabled={!canGoToStep3}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </WizardStep>
      )}

      {/* Step 3: Handover details */}
      {currentStep === 3 && (
        <WizardStep
          title="Détails de la passation"
          description="Quel jour et à quelle heure se fait le changement de garde ?"
        >
          <div className="space-y-6">
            <div>
              <Label>Jour de changement de garde</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={handoverDay === day.value ? 'default' : 'outline'}
                    onClick={() => setHandoverDay(day.value)}
                    className="h-auto py-3"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="handoverTime">Heure de changement</Label>
              <Input
                id="handoverTime"
                type="time"
                value={handoverTime}
                onChange={(e) => setHandoverTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </WizardStep>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
        <WizardStep
          title="Récapitulatif"
          description="Vérifiez votre configuration avant de démarrer"
        >
          <div className="space-y-4 bg-muted/30 p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Votre prénom</p>
                <p className="font-semibold">{yourName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Autre parent</p>
                <p className="font-semibold">{otherParentName}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Résumé du planning</p>
              <p className="text-sm leading-relaxed">{getPreviewText()}</p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 mt-4">
              <p className="text-sm font-medium text-primary mb-2">
                💡 Vous pourrez toujours modifier ce planning plus tard
              </p>
              <p className="text-xs text-muted-foreground">
                Ajoutez des exceptions pour les vacances, modifiez les horaires, et plus encore.
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleComplete} disabled={isSubmitting || !canComplete}>
              {isSubmitting ? (
                <>Création en cours...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Démarrer le planning
                </>
              )}
            </Button>
          </div>
        </WizardStep>
      )}
    </div>
  );
}
