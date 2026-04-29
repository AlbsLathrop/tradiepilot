import { NextRequest, NextResponse } from 'next/server';
import { queryNotionDatabase } from '@/lib/notion';
import { client } from '@/lib/twilio';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.formData();
    const fromNumber = body.get('From') as string;
    const toNumber = body.get('To') as string;
    const messageBody = body.get('Body') as string;
    const messageSid = body.get('MessageSid') as string;

    if (!fromNumber || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Look up contact in Notion using phone number
    const contactsDbId = process.env.NOTION_CONTACTS_DB_ID;
    if (!contactsDbId) {
      console.error('NOTION_CONTACTS_DB_ID not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Query for contact with matching phone number
    const contacts = await queryNotionDatabase(contactsDbId, {
      filter: {
        property: 'Phone',
        phone_number: {
          equals: fromNumber,
        },
      },
    });

    const contact = contacts.length > 0 ? contacts[0] : null;

    // Log the inbound message
    console.log({
      timestamp: new Date().toISOString(),
      messageSid,
      fromNumber,
      toNumber,
      messageBody,
      contactFound: !!contact,
      contactId: contact?.id,
    });

    // TODO: Process message based on contact and content
    // Examples:
    // - Job status updates
    // - Quote responses
    // - Payment confirmations
    // - Schedule changes

    return NextResponse.json(
      { success: true, messageSid },
      { status: 200 }
    );
  } catch (error) {
    console.error('Inbound SMS error:', error);
    return NextResponse.json(
      { error: 'Failed to process inbound message' },
      { status: 500 }
    );
  }
};
