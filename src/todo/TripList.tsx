// TripList.tsx

import React, { useContext, useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading, IonButtons,
} from '@ionic/react';
import { TripContext } from './TripProvider';
import { TripProps } from './TripProps';
import { useHistory } from 'react-router-dom';

const TripList: React.FC = () => {
  const history = useHistory();
  const { trips, fetching, fetchingError } = useContext(TripContext);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (fetchingError) {
      setLocalError(fetchingError.message || 'Failed to fetch trips');
    }
  }, [fetchingError]);

  const handleEdit = (id?: string) => {
    if (id) {
      history.push(`/trips/${id}`);
    }
  };

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Trips</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => history.push('/trip')}>Add Trip</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {fetching && <IonLoading isOpen={fetching} message={'Loading trips...'} />}
          {localError && (
              <IonItem>
                <IonLabel color="danger">{localError}</IonLabel>
              </IonItem>
          )}
          <IonList>
            {trips?.map(trip => (
                <IonItem key={trip.id} onClick={() => handleEdit(trip.id)}>
                  <IonLabel>
                    <h2>{trip.destination}</h2>
                    <p>Budget: {trip.budget}</p>
                    <p>Date: {trip.date ? trip.date.toLocaleDateString() : 'N/A'}</p>
                    <p>With Car: {trip.withCar ? 'Yes' : 'No'}</p>
                  </IonLabel>
                </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonPage>
  );
};

export default TripList;
