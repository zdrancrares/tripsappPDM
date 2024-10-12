import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { getLogger } from '../core';
import { TripContext } from './TripProvider';
import Trip from "./Trip";

const log = getLogger('TripList');

const TripList: React.FC<RouteComponentProps> = ({ history }) => {
  const { trips, fetching, fetchingError } = useContext(TripContext);
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching trips" />
        {trips && (
          <IonList>
            {trips.map(({ id, destination, withCar, budget, date}) =>
              <Trip key={id} id={id} destination={destination} withCar={withCar} budget={budget} date={date} onEdit={id => history.push(`/trip/${id}`)} />)}
          </IonList>
        )}
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch trips'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/trip')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default TripList;
