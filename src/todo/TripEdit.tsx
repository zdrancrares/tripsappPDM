import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const [trip, setTrip] = useState<TripProps | undefined>(undefined);

  const destinationRef = useRef('');
  const budgetRef = useRef(0);
  const dateRef = useRef<Date | null>(null);
  const withCarRef = useRef(false);

  useEffect(() => {
    const routeId = match.params.id;
    if (routeId && trips) {
      const foundTrip = trips.find(t => t.id === routeId);
      if (foundTrip) {
        setTrip(foundTrip);
        destinationRef.current = foundTrip.destination;
        budgetRef.current = foundTrip.budget;
        dateRef.current = foundTrip.date;
        withCarRef.current = foundTrip.withCar;
      }
    }
  }, [match.params.id]);

  // useEffect(() => {
  //   if (trip) {
  //     destinationRef.current = trip.destination;
  //     budgetRef.current = trip.budget;
  //     dateRef.current = trip.date;
  //     withCarRef.current = trip.withCar;
  //   }
  // }, [trip]);

  const handleSave = useCallback(() => {
    const formattedDate = dateRef.current ? new Date(dateRef.current) : new Date();

    const editedTrip: TripProps = trip
        ? { ...trip, date: formattedDate, destination: destinationRef.current, budget: budgetRef.current, withCar: withCarRef.current }
        : { date: formattedDate, destination: destinationRef.current, budget: budgetRef.current, withCar: withCarRef.current };

    saveTrip && saveTrip(editedTrip).then(() => history.goBack());
  }, [trip, saveTrip, history]);

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
              defaultValue={destinationRef.current}
              onIonChange={e => destinationRef.current = e.detail.value || ''}
          />
          <IonItem>
            <IonLabel>Date</IonLabel>
            <IonDatetime
                presentation="date"
                value={dateRef.current ? dateRef.current.toISOString().split('T')[0] : ''}
                onIonChange={e => {
                  const newValue = e.detail.value as string;
                  dateRef.current = newValue ? new Date(newValue) : null;
                }}
                min="2024-01-01"
                max="2025-12-31"
            />
          </IonItem>
          <IonItem>
            <IonLabel>Does this trip involve a car?</IonLabel>
            <IonToggle
                checked={withCarRef.current}
                onIonChange={e => withCarRef.current = e.detail.checked}
            />
          </IonItem>
          <IonInput
              type="number"
              placeholder="Enter the budget for this trip"
              defaultValue={budgetRef.current}
              onIonChange={e => budgetRef.current = Number(e.detail.value) || 0}
          />
          <IonLoading isOpen={saving} />
          {savingError && <div>{savingError.message || 'Failed to save trip'}</div>}
        </IonContent>
      </IonPage>
  );
};

export default TripEdit;