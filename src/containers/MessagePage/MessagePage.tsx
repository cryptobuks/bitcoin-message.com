import * as React from 'react';
import {AppError} from '../../models/app-error.model';
import {inject} from 'mobx-react';
import {MessagesStore} from '../../stores/messages.store';
import {match, Redirect} from 'react-router';
import './MessagePage.css';
import {DonationForm} from '../../components/DonationForm/DonationForm';
import {Message} from '../../shared/api-models/message.model';
import {appConfig} from '../../config';

interface Props {
  match: match<{id: string}>;
  messagesStore: MessagesStore;
}

interface State {
  donationAmount: number;
  donationCurrency: string;
  message?: Message;
  donorEmail?: string;
}

@inject('messagesStore')
export class MessagePage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      donationAmount: this.isUserFromRussia() ? appConfig.donations.minDonationAmountRU : appConfig.donations.minDonationAmount,
      donationCurrency: this.isUserFromRussia() ? appConfig.donations.minDonationCurrencyRU : appConfig.donations.minDonationCurrency
    };
    
    // Load info about message
    this.retrieveMessageInfo();
    
    this.handleDonateValidationError = this.handleDonateValidationError.bind(this);
    this.handleSubmitDonate = this.handleSubmitDonate.bind(this);
    this.handleCheckDonationStatusClick = this.handleCheckDonationStatusClick.bind(this);
  }
  
  render() {
    if (this.state.message && this.state.message.isPublished) {
      return (
        <Redirect to={`/published/${this.state.message.blockchainTxId}`} />
      );
    }
    
    return (
      <div className="MessagePage">
        <section>
          <div className="section-content">
            <div className="p">
              <div>Your message:</div>
              {this.state.message ? (
              <div>{this.state.message.message}</div>
              ) : ''}
            </div>
            <p className="text-center">
              You need to donate Bitcoin's network transaction fee with PayPal
              so we can successfully push your message to the blockchain.
            </p>
            <div className="p">
              <DonationForm
                donationAmount={this.state.donationAmount}
                donationCurrency={this.state.donationCurrency}
                onSubmit={this.handleSubmitDonate}
                onValidationError={this.handleDonateValidationError}
              />
            </div>
            {this.state.donorEmail ? (
              <div>
                <p className="text-center"><i className="fa fa-arrow-down"/></p>
                <p>
                  <button className="primary full-width" onClick={this.handleCheckDonationStatusClick}>Check Donation Status</button>
                </p>
              </div>
            ) : ''}
          </div>
        </section>
      </div>
    );
  }

  /**
   * Returns TRUE if user is from Russia (needed because of PayPal donations restrictions)
   * @returns {boolean}
   */
  isUserFromRussia(): boolean {
    return window.navigator.languages.indexOf('ru') !== -1
      || window.navigator.languages.indexOf('ru-RU') !== -1
      || !!window.navigator.language.match('ru')
    ;
  }

  /**
   * Loads info about current message from server and store it to state
   */
  protected retrieveMessageInfo() {
    this.props.messagesStore
      .getMessageById(this.props.match.params.id)
      .then(
        m => this.setState({message: m}),
        e => alert(e.message)
      );
  }

  /**
   * Checks donation status using current state data
   * @param {boolean} isSilent  If TRUE, will not show any alerts
   */
  protected checkDonationStatus(isSilent: boolean = false) {
    this.props.messagesStore.checkMessageStatus({
      messageId: this.state.message!.id!,
      email: this.state.donorEmail!,
    }).then(response => {
      // Check if we found donation
      if (response.donation) {
        // Check if donation processed with error
        if (response.donation.errorMessage) {
          if (!isSilent) {
            alert(response.donation.errorMessage);
          }
        } else {
          // Update info about message to find out txID
          this.retrieveMessageInfo();
        }
      } else {
        if (!isSilent) {
          alert(`Hmm, can't find your donation. Check that email is correct (should be your PayPal email used for donation).`);
        }
      }
    }, e => alert(e.message));
  }

  /**
   * Returns donation URL for PayPal
   * @returns {string}
   */
  protected getDonationUrl(): string {
    return `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=bobrosoft@yandex.ru&item_name=bitcoin-message.com&item_number=Cover+transaction+fee&`
      + `currency_code=${this.state.donationCurrency}&amount=${this.state.donationAmount}`;
  }

  protected handleDonateValidationError(error: AppError) {
    alert(error.message);
  }

  protected handleSubmitDonate(email: string) {
    this.setState({donorEmail: email}, () => {
      this.checkDonationStatus(true); // that's just in case to save email
    });
    
    // Redirect to PayPal
    window.open(this.getDonationUrl(), '_blank');
  }
  
  protected handleCheckDonationStatusClick() {
    this.checkDonationStatus();
  }
}