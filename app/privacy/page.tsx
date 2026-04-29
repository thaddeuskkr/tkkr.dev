import * as motion from "motion/react-client";

const effectiveDate = "30 April 2026";

function Bold({ children }: { children: React.ReactNode }) {
    return <span className="font-bold">{children}</span>;
}

function Header({ children }: { children: React.ReactNode }) {
    return <span className="pt-1 font-bold">{children}</span>;
}

export default function Privacy() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">privacy policy</span>
                    <div className="flex flex-row gap-1">
                        <Bold>effective date:</Bold>
                        <span>{effectiveDate}</span>
                    </div>
                    <div className="flex flex-row gap-1">
                        <Bold>website:</Bold>
                        <span>tkkr.dev</span>
                    </div>
                    <div className="flex flex-row gap-1">
                        <Bold>operator:</Bold>
                        <span>Thaddeus Kuah</span>
                    </div>

                    <div className="flex flex-col gap-2 pt-4">
                        <p>
                            This Privacy Policy explains how Thaddeus Kuah collects, uses,
                            discloses, stores, and protects personal data in connection with
                            <Bold> tkkr.dev</Bold>, <Bold>id.tkkr.dev</Bold>, and any related
                            websites, applications, identity services, file hosting services,
                            payment features, subscription features, donation features, and other
                            services operated by me.
                        </p>
                        <p>
                            By accessing or using the Services, you acknowledge that your personal
                            data may be collected, used, disclosed, and processed in accordance with
                            this Privacy Policy.
                        </p>

                        <Header>1. Definitions</Header>
                        <p>In this Privacy Policy:</p>
                        <p>
                            &quot;<Bold>Services</Bold>&quot; means the websites, applications,
                            infrastructure, identity services, file hosting services, payment
                            features, subscription features, donation features, and other services
                            made available through or in connection with <Bold>tkkr.dev</Bold>.
                        </p>
                        <p>
                            &quot;<Bold>I</Bold>&quot;, &quot;<Bold>me</Bold>&quot;, or &quot;
                            <Bold>my</Bold>&quot; refers to Thaddeus Kuah.
                        </p>
                        <p>
                            &quot;<Bold>You</Bold>&quot; or &quot;<Bold>user</Bold>&quot; refers to
                            any person who accesses or uses the Services.
                        </p>
                        <p>
                            &quot;<Bold>Personal data</Bold>&quot; means data about an individual
                            who can be identified from that data, or from that data and other
                            information that I have or may have access to.
                        </p>

                        <Header>2. Personal Data I Collect</Header>
                        <p>
                            Depending on how you use the Services, I may collect the following types
                            of personal data:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>
                                Account information, such as your name, username, email address,
                                phone number, authentication identifiers, login activity, and
                                account settings.
                            </li>
                            <li>
                                Contact information, such as your email address, phone number, or
                                other details you provide when contacting me.
                            </li>
                            <li>
                                Billing and payment-related information, such as your name, billing
                                address, payment status, subscription status, donation records,
                                invoices, transaction identifiers, and limited payment-related
                                metadata.
                            </li>
                            <li>
                                Identity and authentication information, especially when you create
                                or use an account through <Bold>id.tkkr.dev</Bold>.
                            </li>
                            <li>
                                Technical information, such as IP address, device information,
                                browser type, operating system, user agent, referring URLs, access
                                times, logs, error reports, and diagnostic data.
                            </li>
                            <li>
                                Usage information, such as pages visited, services used, account
                                activity, feature usage, and interactions with the Services.
                            </li>
                            <li>
                                File hosting information, such as files you upload, file names,
                                metadata, storage usage, access logs, and related technical records.
                            </li>
                            <li>
                                Communications, such as messages, emails, support requests, abuse
                                reports, or other correspondence you send to me.
                            </li>
                            <li>Other information you choose to provide.</li>
                        </ol>
                        <p>
                            I do not directly process or store your full payment card details.
                            Payment card information is processed by third-party payment processors
                            such as Stripe. Stripe explains in its own Privacy Policy and Privacy
                            Center how it collects, uses, retains, discloses, and safeguards
                            personal data submitted to Stripe.
                        </p>

                        <Header>3. How I Collect Personal Data</Header>
                        <p>You may provide or generate personal data when you:</p>
                        <ol className="list-inside list-decimal">
                            <li>
                                visit or use <Bold>tkkr.dev</Bold> or related Services;
                            </li>
                            <li>create, access, or manage an account;</li>
                            <li>
                                sign in through <Bold>id.tkkr.dev</Bold>;
                            </li>
                            <li>make a payment, start a subscription, or make a donation;</li>
                            <li>upload, store, download, or share files;</li>
                            <li>contact me by email or another communication method;</li>
                            <li>
                                interact with security, authentication, logging, or monitoring
                                systems;
                            </li>
                            <li>use features that rely on third-party services; or</li>
                            <li>otherwise provide information to me.</li>
                        </ol>
                        <p>
                            Some information may be collected automatically through logs, cookies,
                            similar technologies, or server-side monitoring tools.
                        </p>

                        <Header>4. How I Use Personal Data</Header>
                        <p>
                            I may collect, use, and process personal data for the following
                            purposes:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>to provide, operate, maintain, and improve the Services;</li>
                            <li>to create, authenticate, secure, and manage accounts;</li>
                            <li>
                                to operate the OIDC identity platform at <Bold>id.tkkr.dev</Bold>;
                            </li>
                            <li>
                                to process subscriptions, donations, payments, invoices, and billing
                                records;
                            </li>
                            <li>
                                to communicate with you about your account, payments, security,
                                support requests, or changes to the Services;
                            </li>
                            <li>
                                to provide file hosting, storage, access, and related functionality;
                            </li>
                            <li>
                                to monitor, debug, troubleshoot, and improve service reliability;
                            </li>
                            <li>
                                to detect, prevent, and respond to spam, abuse, fraud, security
                                incidents, unauthorised access, and illegal activity;
                            </li>
                            <li>to enforce the Terms of Service and other applicable policies;</li>
                            <li>
                                to comply with legal, regulatory, tax, accounting, security, and
                                record-keeping obligations;
                            </li>
                            <li>
                                to protect my rights, users, the Services, and third parties; and
                            </li>
                            <li>
                                for any other purpose that you consent to or that is permitted by
                                applicable law.
                            </li>
                        </ol>
                        <p>
                            Singapore&apos;s PDPA requires organisations to notify individuals of
                            the purposes for which personal data is collected, used, or disclosed,
                            and to collect, use, or disclose personal data only for appropriate
                            purposes in the circumstances.
                        </p>

                        <Header>5. Payments and Stripe</Header>
                        <p>
                            Payments, subscriptions, and donations may be processed by Stripe or
                            other third-party payment processors.
                        </p>
                        <p>
                            When you make a payment, the payment processor may collect and process
                            information such as your name, email address, billing address, payment
                            method details, transaction information, fraud prevention signals, and
                            other information needed to process the transaction.
                        </p>
                        <p>
                            I may receive limited payment-related information from the payment
                            processor, such as your name, email address, billing address, payment
                            status, subscription status, transaction identifier, invoice details,
                            and partial payment method information.
                        </p>
                        <p>
                            Your use of Stripe may be subject to Stripe&apos;s own terms, privacy
                            policy, and data processing terms. Stripe publishes its Privacy Policy,
                            Privacy Center, and Data Processing Agreement explaining how it handles
                            personal data.
                        </p>

                        <Header>6. Cookies and Similar Technologies</Header>
                        <p>
                            The Services may use cookies, local storage, session storage, or similar
                            technologies to:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>keep you signed in;</li>
                            <li>maintain sessions;</li>
                            <li>remember preferences;</li>
                            <li>support security features;</li>
                            <li>prevent fraud or abuse;</li>
                            <li>understand usage and performance; and</li>
                            <li>operate payment, authentication, or third-party integrations.</li>
                        </ol>
                        <p>
                            You may be able to control cookies through your browser settings.
                            However, disabling cookies or similar technologies may affect the
                            functionality of the Services, especially account login and
                            authentication features.
                        </p>

                        <Header>7. How I Disclose Personal Data</Header>
                        <p>I may disclose personal data in the following circumstances:</p>
                        <ol className="list-inside list-decimal">
                            <li>
                                To service providers, such as hosting providers, infrastructure
                                providers, email providers, payment processors, authentication
                                providers, analytics providers, security providers, and other
                                technical vendors.
                            </li>
                            <li>
                                To payment processors, such as Stripe, where necessary to process
                                payments, subscriptions, donations, refunds, fraud checks, or
                                billing records.
                            </li>
                            <li>
                                To comply with law, legal processes, regulatory obligations, court
                                orders, or lawful requests from public authorities.
                            </li>
                            <li>
                                To protect rights and safety, including investigating abuse, fraud,
                                security issues, policy violations, or threats to users or the
                                Services.
                            </li>
                            <li>
                                In connection with service changes, such as migration,
                                restructuring, transfer, or discontinuation of parts of the
                                Services.
                            </li>
                            <li>With your consent, where you have authorised the disclosure.</li>
                        </ol>
                        <p>I do not sell your personal data.</p>

                        <Header>8. Third-Party Services</Header>
                        <p>
                            The Services may rely on third-party services, including payment
                            processors, hosting providers, infrastructure providers, analytics
                            providers, authentication providers, email providers, and other tools.
                        </p>
                        <p>
                            These third-party services may collect, process, store, or access
                            personal data according to their own terms and privacy policies. I am
                            not responsible for the privacy practices of third-party services.
                        </p>
                        <p>
                            You should review the privacy policies of any third-party services that
                            apply to your use of the Services.
                        </p>

                        <Header>9. International Transfers</Header>
                        <p>
                            Personal data may be stored or processed outside Singapore, including in
                            countries where my service providers, infrastructure providers, or
                            payment processors operate.
                        </p>
                        <p>
                            Where personal data is transferred outside Singapore, I will take
                            reasonable steps required by applicable law to ensure that the
                            transferred personal data receives a standard of protection comparable
                            to the protection under Singapore&apos;s PDPA, where required.
                        </p>

                        <Header>10. Data Security</Header>
                        <p>
                            I take reasonable steps to protect personal data against unauthorised
                            access, collection, use, disclosure, copying, modification, disposal,
                            loss, misuse, and similar risks.
                        </p>
                        <p>
                            Security measures may include access controls, authentication,
                            encryption where appropriate, logging, monitoring, backups,
                            infrastructure security controls, and other technical or organisational
                            safeguards.
                        </p>
                        <p>
                            However, no system is completely secure. I cannot guarantee that
                            personal data will always remain secure, and you use the Services at
                            your own risk.
                        </p>
                        <p>
                            You are responsible for keeping your account credentials secure and for
                            protecting your own devices and systems.
                        </p>

                        <Header>11. Data Retention</Header>
                        <p>
                            I retain personal data only for as long as reasonably necessary for the
                            purposes described in this Privacy Policy, unless a longer retention
                            period is required or permitted by law.
                        </p>
                        <p>Retention periods may depend on:</p>
                        <ol className="list-inside list-decimal">
                            <li>the type of data;</li>
                            <li>the purpose for which it was collected;</li>
                            <li>account status;</li>
                            <li>payment, tax, accounting, or legal requirements;</li>
                            <li>security, fraud prevention, or abuse prevention needs;</li>
                            <li>backup and disaster recovery practices; and</li>
                            <li>
                                whether the data is needed to resolve disputes or enforce
                                agreements.
                            </li>
                        </ol>
                        <p>
                            When personal data is no longer needed, I will take reasonable steps to
                            delete, anonymise, or securely dispose of it, unless retention is
                            required or permitted by law.
                        </p>

                        <Header>12. Access and Correction</Header>
                        <p>
                            You may request access to personal data that I hold about you, or
                            request correction of inaccurate or incomplete personal data.
                        </p>
                        <p>
                            To make a request, contact me using the details in the
                            &quot;Contact&quot; section below.
                        </p>
                        <p>
                            I may need to verify your identity before responding. I may also refuse,
                            limit, or charge for requests where permitted by applicable law.
                        </p>

                        <Header>13. Withdrawal of Consent</Header>
                        <p>
                            Where I rely on your consent to collect, use, or disclose personal data,
                            you may withdraw your consent by contacting me.
                        </p>
                        <p>
                            If you withdraw consent, I may no longer be able to provide some or all
                            of the Services to you. Withdrawal of consent does not affect any
                            collection, use, disclosure, or processing that occurred before the
                            withdrawal, or any processing that is permitted or required by law.
                        </p>

                        <Header>14. Account Deletion</Header>
                        <p>
                            If account deletion features are available, you may request deletion of
                            your account by contacting me or using the account settings provided
                            through the Services.
                        </p>
                        <p>
                            Some data may be retained after account deletion where necessary for
                            legal, tax, accounting, security, fraud prevention, abuse prevention,
                            backup, dispute resolution, or service integrity purposes.
                        </p>
                        <p>
                            Files, logs, payment records, and technical records may not be deleted
                            immediately from backups or archival systems, but will be handled
                            according to applicable retention practices.
                        </p>

                        <Header>15. Children and Minors</Header>
                        <p>
                            The Services are available to general users, but they are not
                            specifically directed at children.
                        </p>
                        <p>
                            If you are a minor, you should use the Services only with appropriate
                            consent or supervision from a parent or guardian where required by
                            applicable law.
                        </p>
                        <p>
                            If I become aware that personal data has been collected in a way that
                            requires parental consent and such consent has not been provided, I may
                            delete or restrict the relevant account or data.
                        </p>

                        <Header>16. Marketing Communications</Header>
                        <p>
                            I may send service-related communications, such as account notices,
                            security alerts, billing messages, payment notices, and important
                            updates. These are not marketing communications and may be necessary for
                            the Services.
                        </p>
                        <p>
                            I will only send marketing communications where permitted by law. You
                            may opt out of marketing communications using the unsubscribe method
                            provided or by contacting me.
                        </p>

                        <Header>17. Data Breaches</Header>
                        <p>
                            If a data breach occurs, I will assess the breach and take steps
                            required by applicable law.
                        </p>
                        <p>
                            Where required, I may notify affected individuals, regulators, service
                            providers, or other relevant parties.
                        </p>

                        <Header>18. Links to Other Websites</Header>
                        <p>The Services may contain links to third-party websites or services.</p>
                        <p>
                            I am not responsible for the privacy practices, content, security, or
                            policies of third-party websites or services. You should review their
                            privacy policies before providing personal data to them.
                        </p>

                        <Header>19. Changes to This Privacy Policy</Header>
                        <p>I may update this Privacy Policy from time to time.</p>
                        <p>
                            If I make material changes, I may provide notice by posting the updated
                            Privacy Policy on the website, updating the effective date, or using
                            another reasonable method.
                        </p>
                        <p>
                            Your continued use of the Services after the updated Privacy Policy
                            takes effect means you acknowledge the updated Privacy Policy.
                        </p>

                        <Header>20. Contact</Header>
                        <p>
                            For questions, requests, corrections, withdrawals of consent, account
                            deletion requests, or privacy-related concerns, contact:
                        </p>
                        <p>
                            Thaddeus Kuah
                            <br />
                            <Bold>Website:</Bold>{" "}
                            <a href="https://tkkr.dev" target="_blank" rel="noopener noreferrer">
                                tkkr.dev
                            </a>
                            <br />
                            <Bold>Email:</Bold> <a href="mailto:tk@tkkr.dev">tk@tkkr.dev</a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
