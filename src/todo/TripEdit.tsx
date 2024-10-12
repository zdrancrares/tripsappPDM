import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonDatetime,
} from '@ionic/react';
import { getLogger } from '../core';
import { TripContext } from './TripProvider';
import { RouteComponentProps } from 'react-router';
import { TripProps } from './TripProps';

const log = getLogger('TripEdit');

interface TripEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const TripEdit: React.FC<TripEditProps> = ({ history, match }) => {
  const { trips, saving, savingError, saveTrip } = useContext(TripContext);
  const [withCar, setWithCar] = useState(false);
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [trip, setTrip] = useState<TripProps | undefined>(undefined);

  useEffect(() => {
    const routeId = match.params.id;
    if (routeId) {
      const foundTrip = trips?.find(t => t.id === routeId);
      setTrip(foundTrip);
      if (foundTrip) {
        setDate(foundTrip.date);
        setBudget(foundTrip.budget);
        setDestination(foundTrip.destination);
        setWithCar(foundTrip.withCar);
      }
    }
  }, [match.params.id, trips]);

  const handleSave = useCallback(() => {
    const formattedDate = date ? new Date(date) : new Date();

    const editedTrip: TripProps = trip
        ? { ...trip, date: formattedDate, destination, budget, withCar }
        : { date: formattedDate, destination, budget, withCar };

    saveTrip && saveTrip(editedTrip).then(() => history.goBack());
  }, [trip, saveTrip, date, destination, budget, withCar, history]);

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{trip ? 'Edit Trip' : 'Add New Trip'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleSave}>
                {trip ? 'Save' : 'Create'}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonInput
              placeholder="Enter the destination"
              value={destination}
              onIonChange={e => setDestination(e.detail.value || '')}
          />
          <IonItem>
            <IonLabel>Date</IonLabel>
            <IonDatetime
                presentation="date"
                value={date ? date.toISOString().split('T')[0] : ''}
                onIonChange={e => {
                  const newValue = e.detail.value as string;
                  setDate(newValue ? new Date(newValue) : null);
                }}
                min="2024-01-01"
                max="2025-12-31"
            />
          </IonItem>
          <IonItem>
            <IonLabel>Does this trip involve a car?</IonLabel>
            <IonToggle
                checked={withCar}
                onIonChange={e => setWithCar(e.detail.checked)}
            />
          </IonItem>
          <IonInput
              type="number"
              placeholder="Enter the budget for this trip"
              value={budget}
              onIonChange={e => setBudget(Number(e.detail.value) || 0)}
          />
          <IonLoading isOpen={saving} />
          {savingError && <div>{savingError.message || 'Failed to save trip'}</div>}
        </IonContent>
      </IonPage>
  );
};

export default TripEdit;
