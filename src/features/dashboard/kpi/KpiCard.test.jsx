import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { KpiCard } from './KpiCard'

afterEach(cleanup)

describe('KpiCard', () => {
    it('renders label, headline value, full value tooltip, and icon', () => {
        const { container } = render(
            <KpiCard
                label="Total sales"
                icon="pi-wallet"
                value="₹1.4Cr"
                fullValue="₹1,42,35,890"
                delta={{ direction: 'up', text: '+8.2%', title: 'vs prior period' }}
            />
        )

        expect(screen.getByText('Total sales')).toBeTruthy()
        const headline = screen.getByText('₹1.4Cr')
        expect(headline.getAttribute('title')).toBe('₹1,42,35,890')
        expect(container.querySelector('i.pi.pi-wallet')).toBeTruthy()
    })

    it('renders subtext only when provided', () => {
        const { rerender } = render(
            <KpiCard
                label="Avg rating"
                icon="pi-star"
                value="4.6"
                fullValue="4.62"
                subtext="Driver 4.7"
            />
        )

        expect(screen.getByText('Driver 4.7')).toBeTruthy()

        rerender(
            <KpiCard
                label="Avg rating"
                icon="pi-star"
                value="4.6"
                fullValue="4.62"
            />
        )

        expect(screen.queryByText('Driver 4.7')).toBeNull()
    })

    it('renders an upward delta badge with tooltip and direction', () => {
        render(
            <KpiCard
                label="Trips"
                icon="pi-car"
                value="1.2L"
                fullValue="1,20,400"
                delta={{ direction: 'up', text: '+4.5%', title: '+5,200 trips' }}
            />
        )

        const badge = screen.getByTestId('kpi-delta')
        expect(badge.getAttribute('data-direction')).toBe('up')
        expect(badge.getAttribute('title')).toBe('+5,200 trips')
        expect(badge.textContent).toContain('+4.5%')
        expect(badge.querySelector('i.pi.pi-arrow-up-right')).toBeTruthy()
    })

    it('renders a downward delta badge with direction', () => {
        render(
            <KpiCard
                label="Distance"
                icon="pi-map"
                value="84,210 km"
                fullValue="84,210 km"
                delta={{ direction: 'down', text: '-2.1%', title: '-1,805 km' }}
            />
        )

        const badge = screen.getByTestId('kpi-delta')
        expect(badge.getAttribute('data-direction')).toBe('down')
        expect(badge.textContent).toContain('-2.1%')
        expect(badge.querySelector('i.pi.pi-arrow-down-right')).toBeTruthy()
    })

    it('renders flat and none delta states cleanly and handles missing delta', () => {
        const { rerender } = render(
            <KpiCard
                label="Total sales"
                icon="pi-wallet"
                value="₹50,000"
                fullValue="₹50,000"
                delta={{ direction: 'flat', text: '0.0%', title: 'No change' }}
            />
        )

        expect(screen.getByTestId('kpi-delta').getAttribute('data-direction')).toBe('flat')

        rerender(
            <KpiCard
                label="Total sales"
                icon="pi-wallet"
                value="₹50,000"
                fullValue="₹50,000"
                delta={{ direction: 'none', text: 'No prior data', title: '' }}
            />
        )

        const noneBadge = screen.getByTestId('kpi-delta')
        expect(noneBadge.getAttribute('data-direction')).toBe('none')
        expect(noneBadge.querySelector('i')).toBeNull()

        rerender(
            <KpiCard
                label="Total sales"
                icon="pi-wallet"
                value="₹50,000"
                fullValue="₹50,000"
            />
        )

        expect(screen.queryByTestId('kpi-delta')).toBeNull()
    })
})