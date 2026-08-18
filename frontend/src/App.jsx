import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import CreateEventForm from './components/CreateEventForm';
import BoxOffice from './components/BoxOffice';
import GateCheckIn from './components/GateCheckIn';
import EventFeed from './components/EventFeed';
import LoadingOverlay from './components/LoadingOverlay';
import { useWallet } from './hooks/useWallet';
import { useContractEvents } from './hooks/useContractEvents';
import { factoryClient } from './contracts/factoryClient';
import { CONTRACTS } from './contracts/config';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const wallet = useWallet();
  const { events, connected, error: eventError } = useContractEvents();

  const [view, setView] = useState('buy');
  const [event, setEvent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  
  // Show wallet errors as toasts
  useEffect(() => {
    if (wallet.error) {
      toast.error(wallet.error);
    }
  }, [wallet.error]);

  async function handleLookupEvent(eventId) {
    setLoadingEvent(true);
    try {
      const result = await factoryClient.getEvent(eventId, wallet.address);
      setEvent(result);
      setTicket(null);
    } catch (err) {
      toast.error(`Could not load event #${eventId}. It may not exist.`);
      setEvent(null);
    } finally {
      setLoadingEvent(false);
    }
  }

  async function handleCreateEvent({ name, faceValue, totalTickets, maxResaleBps, royaltyBps }) {
    if (!wallet.isConnected) {
      toast.error('Connect a wallet first to publish an event.');
      return;
    }
    setCreatingEvent(true);
    try {
      const { hash, returnValue } = await factoryClient.createEvent(
        wallet.address,
        name,
        CONTRACTS.TOKEN_CONTRACT_ID,
        CONTRACTS.REGISTRY_CONTRACT_ID,
        faceValue,
        totalTickets,
        maxResaleBps,
        royaltyBps,
        wallet.signTransaction
      );
      toast.success(
        <div>
          Event published! Event ID: <strong>{returnValue?.toString() || 'Unknown'}</strong>. <br />
          <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-semibold mt-1 inline-block">
            View transaction
          </a>
        </div>,
        { duration: 5000 }
      );
      wallet.refreshBalance();
    } catch (err) {
      toast.error(`Failed to publish event: ${err.message}`);
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleMint(eventId) {
    if (!wallet.isConnected) {
      toast.error('Connect a wallet first.');
      return;
    }
    setActionLoading(true);
    try {
      const { hash, returnValue } = await factoryClient.mintTicket(eventId, wallet.address, wallet.signTransaction);
      const ev = await factoryClient.getEvent(eventId, wallet.address);
      const maxResalePrice = (Number(ev.face_value) * 11000) / 10000;
      
      const mintedTicketId = returnValue !== null ? returnValue.toString() : (ev.tickets_minted - 1).toString();
      
      setTicket({ ticketIdDisplay: mintedTicketId, owner: wallet.address, maxResalePrice });
      setEvent(ev);
      toast.success(
        <div>
          Ticket minted! Ticket ID: <strong>{mintedTicketId}</strong>. <br />
          <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-semibold mt-1 inline-block">
            View transaction
          </a>
        </div>,
        { duration: 5000 }
      );
      wallet.refreshBalance();
    } catch (err) {
      toast.error(`Mint failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResell(eventId, ticketId, buyer, price) {
    setActionLoading(true);
    try {
      const priceStroops = Math.round(Number(price) * 10000000);
      const { hash } = await factoryClient.resellTicket(eventId, ticketId, buyer, priceStroops, wallet.signTransaction);
      toast.success(
        <div>
          Ticket resold successfully! <br />
          <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-semibold mt-1 inline-block">
            View transaction
          </a>
        </div>,
        { duration: 5000 }
      );
      wallet.refreshBalance();
    } catch (err) {
      toast.error(`Resale failed — the price may exceed the cap. (${err.message})`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyEntry(eventId, ticketId) {
    setActionLoading(true);
    try {
      const { hash } = await factoryClient.verifyEntry(eventId, ticketId, wallet.address, wallet.signTransaction);
      toast.success(
        <div>
          Entry verified for Ticket #{ticketId}! <br />
          <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-semibold mt-1 inline-block">
            View transaction
          </a>
        </div>
      );
      wallet.refreshBalance();
    } catch (err) {
      toast.error(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: '!bg-zinc-900 !text-white !border !border-zinc-800',
        }} 
      />
      {actionLoading && <LoadingOverlay message="Processing Transaction..." />}
      {creatingEvent && <LoadingOverlay message="Publishing Event..." />}
      
      <NavBar wallet={wallet} view={view} onViewChange={setView} />
      {view === 'buy' && <Hero />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {view === 'buy' && (
              <BoxOffice
                wallet={wallet}
                onLookupEvent={handleLookupEvent}
                onMint={handleMint}
                onResell={handleResell}
                event={event}
                ticket={ticket}
                loadingEvent={loadingEvent}
                actionLoading={actionLoading}
              />
            )}

            {view === 'organizer' && (
              <CreateEventForm onCreate={handleCreateEvent} loading={creatingEvent} />
            )}

            {view === 'gate' && (
              <GateCheckIn onVerify={handleVerifyEntry} actionLoading={actionLoading} />
            )}
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={events} connected={connected} error={eventError} />
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-8 text-center">
        <p className="text-xs text-ink/40 font-mono">
          Gatefold · Soroban Testnet · Factory {CONTRACTS.FACTORY_CONTRACT_ID.slice(0, 6)}…{CONTRACTS.FACTORY_CONTRACT_ID.slice(-4)}
        </p>
      </footer>
    </div>
  );
}

