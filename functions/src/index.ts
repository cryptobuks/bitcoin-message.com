import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {ProjectConfig} from './models/project-config.model';
// import {TestFunction} from './functions/test.function';
import {MessagesService} from './services/messages.service';
import {ExchangeRatesService} from './services/exchange-rates.service';
import {DonationsService} from './services/donations.service';
import {SaveMessageFunction} from './functions/save-message.function';
import {CheckDonationsFunction} from './functions/check-donations.function';
import {BlockchainServiceFactory} from './services/blockchain-service.factory';

// Init Firebase Admin SDK
admin.initializeApp(functions.config().firebase);

// Create project's config
const config = functions.config() as ProjectConfig;

// Create services (manual DI)
const blockchainService = BlockchainServiceFactory.create(config);
const messagesService = new MessagesService(blockchainService);
const exchangeRatesService = new ExchangeRatesService();
const donationsService = new DonationsService(config, exchangeRatesService, messagesService);

// Register and bootstrap functions (manual DI)
// export let test = new TestFunction(blockchainService).handler;
export let saveMessage = new SaveMessageFunction(config, messagesService).handler;
export let checkDonations = new CheckDonationsFunction(messagesService, donationsService).handler;