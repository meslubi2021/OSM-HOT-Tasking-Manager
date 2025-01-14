import '@testing-library/jest-dom';
import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListOrganisations, CreateOrganisation, EditOrganisation } from '../organisationManagement';
import { store } from '../../store/';

describe('List Interests', () => {
  const setup = () => {
    const userDetails = { id: 1, role: 'ADMIN' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { user, container } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <ListOrganisations />
      </ReduxIntlProviders>,
    );
    return {
      user,
      container,
    };
  };

  it('should show loading placeholder when interests are being fetched', () => {
    const { container } = setup();
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4 * 5);
  });

  it('should fetch and list campaigns', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getByRole('heading', { name: 'American Red Cross' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organisation Name 123' })).toBeInTheDocument();
  });

  it('should only display relevant organizations when they are searched', async () => {
    const { user, container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    const searchBox = screen.getByRole('textbox');
    await user.type(searchBox, 'red');
    expect(screen.getByRole('heading', { name: 'American Red Cross' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Organisation Name 123' }),
    ).not.toBeInTheDocument();
  });
});

describe('Create Organization', () => {
  const setup = () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateOrganisation />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', {
      name: /create organization/i,
    });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
      user,
      createButton,
      cancelButton,
      router,
    };
  };

  it('should disable create organization button by default', async () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should enable create organization button when the value is changed', async () => {
    const { user, createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.type(nameInput, 'New Organization Name');
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created campaign detail page on creation success', async () => {
    const { user, router, createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.type(nameInput, 'New Organization Name');
    const subscriptionType = screen.getByRole('combobox');
    await user.click(subscriptionType);
    await user.click(screen.getByText('Free'));
    await user.click(createButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/organisations/123'));
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('EditCampaign', () => {
  const setup = () => {
    const { user, container, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditOrganisation id={123} />
      </ReduxIntlProviders>,
    );

    return {
      user,
      container,
      history,
    };
  };

  it('should display the campaign name by default', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    expect(nameInput.value).toBe('Organisation Name 123');
  });

  it('should display save button when project name is changed', async () => {
    const { user } = setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Organisation Name');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { user } = setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Organisation Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { user } = setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Organisation Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(nameInput.value).toBe('Organisation Name 123');
  });

  it('should display project cards under the organisation', async () => {
    setup();
    expect(
      await screen.findByRole('heading', {
        name: 'NRCS_Khajura Mapping',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'NRCS_Duduwa Mapping',
      }),
    ).toBeInTheDocument();
  });

  it('should hide the save button after organisation edit is successful', async () => {
    const { user } = setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Organisation Name');
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(saveButton);
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});

describe('Delete Campaign', () => {
  const setup = () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditOrganisation id={123} />
      </ReduxIntlProviders>,
    );

    return {
      user,
      router,
    };
  };

  it('should ask for confirmation when user tries to delete a organization', async () => {
    const { user } = setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    expect(
      screen.getByText('Are you sure you want to delete this organization?'),
    ).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    const { user } = setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this organization?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to organizations list page on successful deletion of a organization', async () => {
    const { user, router } = setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    await waitFor(() =>
      expect(screen.getByText('Organisation deleted successfully.')).toBeInTheDocument(),
    );
    await waitFor(() => expect(router.state.location.pathname).toEqual('/manage/organisations'));
  });
});
