import axios from 'axios';
import { getLogger } from '../core';
import { TripProps } from './TripProps';

const log = getLogger('tripApi');

const baseUrl = 'localhost:3000';
const tripUrl = `http://${baseUrl}/trip`;

interface ResponseProps<T> {
  data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const getTrips: () => Promise<TripProps[]> = () => {
  return withLogs(axios.get(tripUrl, config), 'getTrips');
}

export const createTrip: (trip: TripProps) => Promise<TripProps[]> = trip => {
  return withLogs(axios.post(tripUrl, trip, config), 'createTrip');
}

export const updateTrip: (trip: TripProps) => Promise<TripProps[]> = trip => {
  return withLogs(axios.put(`${tripUrl}/${trip.id}`, trip, config), 'updateTrip');
}

interface MessageData {
  event: string;
  payload: {
    trip: TripProps;
  };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}`)
  ws.onopen = () => {
    log('web socket onopen');
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}
