import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent, IonDatetime,
  IonHeader,
  IonInput, IonItem, IonLabel,
  IonLoading,
  IonPage,
  IonTitle, IonToggle,
  IonToolbar
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

  const [trip, setTrip] = useState<TripProps>();
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const trip = trips?.find(t => t.id === routeId);
    setTrip(trip);
    if (trip) {
      setDate(trip.date);
      setBudget(trip.budget);
      setDestination(trip.destination);
      setWithCar(trip.withCar);
    }
  }, [match.params.id, trips]);

  const handleSave = useCallback(() => {
    const formattedDate = date ? new Date(date) : new Date();

    const editedTrip: TripProps = trip
        ? { ...trip, date: formattedDate, destination, budget, withCar }
        : { date: formattedDate, destination, budget, withCar };

    saveTrip && saveTrip(editedTrip).then(() => history.goBack());
  }, [trip, saveTrip, date, destination, budget, withCar, history]);


  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonInput value={destination} onIonChange={e => setDestination(e.detail.value || '')} />
        <IonItem>
          <IonLabel>Date</IonLabel>
          <IonDatetime
              value={date ? date.toISOString().split('T')[0] : ''}
              onIonChange={e => {
                const newValue = e.detail.value;

                if (typeof newValue === 'string') {
                  setDate(newValue ? new Date(newValue) : null);
                } else {
                  setDate(null); // Handle other types (e.g., string[]) if needed
                }
              }}
          />
        </IonItem>



        <IonItem>
          <IonLabel>Enable Feature</IonLabel>
          <IonToggle
              checked={withCar}
              onIonChange={e => setWithCar(e.detail.checked)}
          />
        </IonItem>
        <IonInput
            type="number"
            value={budget}
            onIonChange={e => setBudget(Number(e.detail.value) || 0)}
        />

        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TripEdit;
