import React, { memo } from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { getLogger } from '../core';
import { TripProps } from './TripProps';

const log = getLogger('Trip');

interface TripPropsExt extends TripProps {
  onEdit: (id?: string) => void;
}

const Trip: React.FC<TripPropsExt> = ({ id, withCar, date, budget, destination, onEdit }) => {
  return (
    <IonItem onClick={() => onEdit(id)}>
        <IonLabel>{withCar ? 'Yes' : 'No'}</IonLabel>
        <IonLabel>{destination}</IonLabel>
        <IonLabel>{budget}</IonLabel>
        <IonLabel>{date ? date.getDate() : 'N/A'}</IonLabel>
    </IonItem>
  );
};

export default memo(Trip);
