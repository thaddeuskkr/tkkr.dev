import * as motion from "motion/react-client";

const effectiveDate = "30 April 2026";

function Bold({ children }: { children: React.ReactNode }) {
    return <span className="font-bold">{children}</span>;
}

function Header({ children }: { children: React.ReactNode }) {
    return <span className="pt-1 font-bold">{children}</span>;
}

export default function ToS() {
    return (
        <main>
            <motion.div
                className="flex flex-col gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}>
                <div className="flex flex-col gap-1">
                    <span className="font-bold">terms of service</span>
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
                            These Terms of Service govern your access to and use of{" "}
                            <Bold>tkkr.dev</Bold>, <Bold>id.tkkr.dev</Bold>, and any related
                            websites, applications, APIs, file hosting services, identity services,
                            payment features, subscription features, donation features, and other
                            services operated by <Bold>Thaddeus Kuah</Bold>.
                        </p>
                        <p>
                            By accessing or using the Services, you agree to these Terms. If you do
                            not agree, you must not use the Services.
                        </p>
                        <Header>1. Definitions</Header>
                        <p>In these Terms:</p>
                        <p>
                            “<Bold>Services</Bold>” means the websites, applications,
                            infrastructure, identity services, file hosting services, payment
                            features, and other services made available through or in connection
                            with <Bold>tkkr.dev</Bold>.
                        </p>
                        <p>
                            “<Bold>I</Bold>”, “<Bold>me</Bold>”, or “<Bold>my</Bold>” refers to
                            Thaddeus Kuah.
                        </p>
                        <p>
                            “<Bold>You</Bold>” or “<Bold>user</Bold>” refers to any person who
                            accesses or uses the Services.
                        </p>
                        <p>
                            “<Bold>Account</Bold>” means an account created through the Services,
                            including accounts created through <Bold>id.tkkr.dev</Bold>.
                        </p>
                        <Header>2. Eligibility</Header>
                        <p>
                            The Services are available to anyone who can legally use them. By using
                            the Services, you confirm that your use of the Services is lawful in
                            your jurisdiction and that you have the ability to agree to these Terms.
                        </p>
                        <p>
                            If you use the Services on behalf of another person, organisation, or
                            entity, you confirm that you have authority to do so.
                        </p>
                        <Header>3. Accounts and Identity Services</Header>
                        <p>
                            Some parts of the Services may require you to create an Account,
                            including through the identity platform at <Bold>id.tkkr.dev</Bold>.
                        </p>
                        <p>You are responsible for:</p>
                        <ol className="list-inside list-decimal">
                            <li>
                                providing accurate information when creating or using an Account;
                            </li>
                            <li>keeping your login credentials secure;</li>
                            <li>all activity that occurs under your Account; and</li>
                            <li>notifying me if you believe your Account has been compromised.</li>
                        </ol>
                        <p>
                            I may suspend or terminate Accounts that appear to be used in breach of
                            these Terms, for security reasons, or where continued access may create
                            risk to the Services or other users.
                        </p>
                        <Header>4. Payments, Subscriptions, and Donations</Header>
                        <p>Some Services may involve payments, subscriptions, or donations.</p>
                        <p>
                            Payments are processed by third-party payment processors, including
                            Stripe. I do not directly process or store your full payment card
                            details. Your use of payment features may also be subject to the
                            relevant payment processor’s own terms, policies, and privacy practices.
                        </p>
                        <p>Unless otherwise stated:</p>
                        <ol className="list-inside list-decimal">
                            <li>donations are voluntary and non-refundable;</li>
                            <li>
                                subscription fees are billed according to the subscription terms
                                shown at checkout;
                            </li>
                            <li>
                                subscriptions may renew automatically unless cancelled before the
                                renewal date;
                            </li>
                            <li>
                                you are responsible for any applicable taxes, bank fees, currency
                                conversion fees, or payment provider charges; and
                            </li>
                            <li>
                                access to paid Services may be suspended or cancelled if payment
                                fails.
                            </li>
                        </ol>
                        <p>
                            Refunds may be provided at my discretion, unless required by applicable
                            law.
                        </p>
                        <Header>5. Acceptable Use</Header>
                        <p>You agree not to misuse the Services.</p>
                        <p>You must not:</p>
                        <ol className="list-inside list-decimal">
                            <li>
                                use the Services for unlawful, fraudulent, harmful, or abusive
                                purposes;
                            </li>
                            <li>
                                upload, store, transmit, or distribute malware, phishing content,
                                spam, or harmful code;
                            </li>
                            <li>
                                attempt to gain unauthorised access to any system, account, network,
                                or data;
                            </li>
                            <li>
                                interfere with, overload, disrupt, or attack the Services, including
                                through denial-of-service attacks;
                            </li>
                            <li>
                                scrape, crawl, harvest, or collect data from the Services without
                                permission;
                            </li>
                            <li>
                                reverse engineer, decompile, disassemble, or attempt to extract
                                source code from any non-open-source part of the Services;
                            </li>
                            <li>
                                bypass or interfere with authentication, authorisation, rate limits,
                                security controls, or usage restrictions;
                            </li>
                            <li>impersonate another person or misrepresent your identity;</li>
                            <li>harass, threaten, abuse, or harm others;</li>
                            <li>
                                upload or distribute content that infringes intellectual property
                                rights or privacy rights;
                            </li>
                            <li>
                                use the Services to host or distribute illegal, harmful, or abusive
                                content; or
                            </li>
                            <li>
                                resell, sublicense, or commercially exploit access to the Services
                                without permission.
                            </li>
                        </ol>
                        <p>
                            I may investigate and take action against any use that I reasonably
                            believe violates these Terms.
                        </p>
                        <Header>7. Third-Party Services</Header>
                        <p>
                            The Services may rely on or integrate with third-party services,
                            including payment processors, hosting providers, identity providers,
                            analytics providers, email providers, infrastructure providers, and
                            other tools.
                        </p>
                        <p>
                            Third-party services are governed by their own terms and policies. I am
                            not responsible for third-party services, including their availability,
                            reliability, security, errors, fees, or handling of data.
                        </p>
                        <p>
                            Your use of third-party services may require you to agree to additional
                            terms.
                        </p>

                        <Header>8. Privacy</Header>
                        <p>
                            Your privacy is important. The collection, use, disclosure, storage, and
                            protection of personal data in connection with the Services is described
                            in the Privacy Policy.
                        </p>
                        <p>
                            By using the Services, you acknowledge that personal data may be
                            collected and handled in accordance with the Privacy Policy. This may
                            include information such as your name, email address, phone number,
                            billing address, account information, payment-related information, logs,
                            device information, and other information necessary to provide, secure,
                            maintain, and improve the Services.
                        </p>
                        <p>
                            Payments may be processed by third-party payment processors, including
                            Stripe. I do not directly process or store your full payment card
                            details.
                        </p>
                        <p>
                            Where applicable, personal data will be handled in accordance with
                            Singapore’s Personal Data Protection Act 2012 and other applicable laws.
                        </p>

                        <Header>9. Intellectual Property</Header>
                        <p>
                            The Services, including their design, branding, software, systems, text,
                            graphics, interfaces, and other materials, are owned by me or my
                            licensors, unless otherwise stated.
                        </p>
                        <p>
                            You may not copy, modify, distribute, sell, lease, or create derivative
                            works from the Services or any part of them unless you have permission
                            or the relevant content is made available under an open-source or other
                            separate licence.
                        </p>
                        <p>
                            Nothing in these Terms transfers ownership of the Services or related
                            intellectual property to you.
                        </p>

                        <Header>10. Availability and Changes to the Services</Header>
                        <p>
                            I may modify, suspend, limit, or discontinue any part of the Services at
                            any time.
                        </p>
                        <p>
                            The Services may be unavailable from time to time due to maintenance,
                            updates, outages, security issues, third-party service failures, or
                            other reasons.
                        </p>
                        <p>
                            I do not guarantee that the Services will always be available,
                            uninterrupted, secure, or error-free.
                        </p>

                        <Header>11. Security</Header>
                        <p>
                            I take reasonable steps to protect the Services, but no system is
                            completely secure.
                        </p>
                        <p>
                            You are responsible for using secure passwords, protecting your Account,
                            and keeping your own devices and systems safe. You must not attempt to
                            test, bypass, or compromise the security of the Services without prior
                            written permission.
                        </p>
                        <p>
                            If you discover a security vulnerability, please report it responsibly
                            to: <a href="mailto:tk@tkkr.dev">tk@tkkr.dev</a>.
                        </p>

                        <Header>12. Suspension and Termination</Header>
                        <p>
                            I may suspend or terminate your access to the Services at any time if:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>you violate these Terms;</li>
                            <li>
                                your use creates legal, security, operational, or reputational risk;
                            </li>
                            <li>payment fails for paid Services;</li>
                            <li>your Account appears compromised or abusive;</li>
                            <li>I am required to do so by law; or</li>
                            <li>I discontinue the relevant Service.</li>
                        </ol>
                        <p>
                            You may stop using the Services at any time. If account deletion
                            features are available, you may request deletion of your Account,
                            subject to legal, security, operational, and record-keeping
                            requirements.
                        </p>
                        <p>
                            Termination does not affect any rights or obligations that should
                            reasonably continue after termination, including payment obligations,
                            disclaimers, limitations of liability, and dispute provisions.
                        </p>

                        <Header>13. Disclaimers</Header>
                        <p>The Services are provided on an “as is” and “as available” basis.</p>
                        <p>
                            To the fullest extent permitted by law, I make no warranties or
                            representations, whether express, implied, or statutory, including
                            warranties of merchantability, fitness for a particular purpose,
                            reliability, availability, accuracy, security, or non-infringement.
                        </p>
                        <p>
                            I do not guarantee that the Services will meet your requirements, be
                            uninterrupted, be error-free, be secure, or that any data will always be
                            available or preserved.
                        </p>
                        <p>You use the Services at your own risk.</p>

                        <Header>14. Limitation of Liability</Header>
                        <p>
                            To the fullest extent permitted by law, I will not be liable for any
                            indirect, incidental, special, consequential, exemplary, or punitive
                            damages, or for any loss of profits, revenue, data, goodwill, business,
                            or opportunity arising from or relating to your use of the Services.
                        </p>
                        <p>
                            To the fullest extent permitted by law, my total liability for any claim
                            arising from or relating to the Services or these Terms will not exceed
                            the greater of:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>
                                the amount you paid to me for the relevant Service in the three
                                months before the claim arose; or
                            </li>
                            <li>SGD 50.</li>
                        </ol>
                        <p>
                            Nothing in these Terms limits liability that cannot be limited under
                            applicable law.
                        </p>

                        <Header>15. Indemnity</Header>
                        <p>
                            You agree to indemnify and hold me harmless from and against any claims,
                            losses, liabilities, damages, costs, and expenses, including reasonable
                            legal fees, arising from or relating to:
                        </p>
                        <ol className="list-inside list-decimal">
                            <li>your use or misuse of the Services;</li>
                            <li>your breach of these Terms;</li>
                            <li>content you upload, store, share, or transmit;</li>
                            <li>your violation of any law or regulation; or</li>
                            <li>your violation of another person’s rights.</li>
                        </ol>

                        <Header>16. Changes to These Terms</Header>
                        <p>I may update these Terms from time to time.</p>
                        <p>
                            If I make material changes, I may provide notice by posting the updated
                            Terms on the website, updating the effective date, or using another
                            reasonable method.
                        </p>
                        <p>
                            Your continued use of the Services after the updated Terms take effect
                            means you accept the updated Terms.
                        </p>

                        <Header>17. Governing Law and Disputes</Header>
                        <p>These Terms are governed by the laws of Singapore.</p>
                        <p>
                            You agree that any dispute arising from or relating to these Terms or
                            the Services will be subject to the courts of Singapore, unless
                            applicable law requires otherwise.
                        </p>
                        <p>
                            Before starting formal legal proceedings, you agree to try to resolve
                            the dispute informally by contacting me first.
                        </p>

                        <Header>18. Contact</Header>
                        <p>
                            For questions about these Terms, account issues, security reports, or
                            other requests, you may contact:
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
